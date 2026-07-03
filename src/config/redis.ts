import net from "node:net";
import tls from "node:tls";
import { EventEmitter } from "node:events";

import { env } from "./env";

type RedisValue = string | number;
type RedisResponse = string | number | null | RedisResponse[];
type PendingCommand = {
  resolve: (value: RedisResponse) => void;
  reject: (error: Error) => void;
};

const MAX_RETRY_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 100;
const MAX_RETRY_DELAY_MS = 2_000;
const RETRY_JITTER_PERCENTAGE = 0.2;

// A3: Central Redis client with JSON helpers, retry handling, and shared connection lifecycle.
class RedisClient extends EventEmitter {
  private socket: net.Socket | tls.TLSSocket | null = null;
  private buffer = Buffer.alloc(0);
  private pendingCommands: PendingCommand[] = [];
  private connectPromise: Promise<void> | null = null;

  private readonly url = new URL(env.REDIS_URL);
  private readonly isTls = this.url.protocol === "rediss:";
  private readonly host = this.url.hostname;
  private readonly port = Number(this.url.port || 6379);
  private readonly password = this.url.password
    ? decodeURIComponent(this.url.password)
    : undefined;
  private readonly username = this.url.username
    ? decodeURIComponent(this.url.username)
    : undefined;
  private readonly database = this.url.pathname.replace("/", "");

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.command("GET", key);

    if (typeof value !== "string") {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async setJson(
    key: string,
    value: unknown,
    expiresInSeconds?: number,
  ): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (expiresInSeconds) {
      await this.command("SET", key, serializedValue, "EX", expiresInSeconds);
      return;
    }

    await this.command("SET", key, serializedValue);
  }

  async del(key: string): Promise<number> {
    const value = await this.command("DEL", key);

    if (typeof value !== "number") {
      throw new Error("Unexpected Redis DEL response.");
    }

    return value;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const value = await this.command("EXPIRE", key, seconds);

    if (value !== 0 && value !== 1) {
      throw new Error("Unexpected Redis EXPIRE response.");
    }

    return value === 1;
  }

  async quit(): Promise<void> {
    this.rejectPending(new Error("Redis connection is closing."));

    if (!this.socket || this.socket.destroyed) {
      this.socket = null;
      this.connectPromise = null;
      return;
    }

    try {
      await this.rawCommand("QUIT");
    } catch {
      // Ignore close-time Redis errors; the socket is being torn down anyway.
    } finally {
      this.disconnect();
    }
  }

  disconnect(): void {
    this.rejectPending(new Error("Redis connection disconnected."));
    this.socket?.destroy();
    this.socket = null;
    this.connectPromise = null;
    this.buffer = Buffer.alloc(0);
  }

  private async command(...args: RedisValue[]): Promise<RedisResponse> {
    await this.connectWithRetry();

    return this.rawCommand(...args);
  }

  private rawCommand(...args: RedisValue[]): Promise<RedisResponse> {
    return new Promise((resolve, reject) => {
      const socket = this.socket;

      if (!socket || socket.destroyed) {
        reject(new Error("Redis socket is not connected."));
        return;
      }

      const pendingCommand = { resolve, reject };

      this.pendingCommands.push(pendingCommand);
      socket.write(this.serializeCommand(args), (error) => {
        if (error) {
          const commandIndex = this.pendingCommands.indexOf(pendingCommand);

          if (commandIndex >= 0) {
            this.pendingCommands.splice(commandIndex, 1);
          }

          reject(error);
        }
      });
    });
  }

  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
      try {
        await this.connect();
        return;
      } catch (error) {
        if (attempt === MAX_RETRY_ATTEMPTS) {
          throw error;
        }

        await this.delay(this.getRetryDelay(attempt));
      }
    }
  }

  private async connect(): Promise<void> {
    if (this.socket && !this.socket.destroyed) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    const connectPromise = new Promise<void>((resolve, reject) => {
      const socket = this.isTls
        ? tls.connect({ host: this.host, port: this.port })
        : net.createConnection({ host: this.host, port: this.port });
      let settled = false;

      const fail = (error: Error) => {
        if (settled) {
          return;
        }

        settled = true;
        this.emit("error", error);
        this.rejectPending(error);
        this.socket = null;
        reject(error);
      };

      socket.once("connect", async () => {
        socket.off("error", fail);
        this.socket = socket;
        this.attachSocketListeners(socket);

        try {
          await this.authenticate();
          await this.selectDatabase();
          settled = true;
          resolve();
        } catch (error) {
          socket.destroy();
          fail(error instanceof Error ? error : new Error(String(error)));
        }
      });

      socket.once("error", fail);
    }).finally(() => {
      this.connectPromise = null;
    });

    this.connectPromise = connectPromise;

    return connectPromise;
  }

  private attachSocketListeners(socket: net.Socket | tls.TLSSocket): void {
    socket.on("data", (chunk) => this.readResponses(chunk));
    socket.on("error", (error) => {
      this.emit("error", error);
      this.rejectPending(error);
    });
    socket.on("close", () => {
      this.socket = null;
      this.connectPromise = null;
    });
  }

  private async authenticate(): Promise<void> {
    if (!this.password) {
      return;
    }

    if (this.username) {
      await this.rawCommand("AUTH", this.username, this.password);
      return;
    }

    await this.rawCommand("AUTH", this.password);
  }

  private async selectDatabase(): Promise<void> {
    if (!this.database) {
      return;
    }

    await this.rawCommand("SELECT", Number(this.database));
  }

  private readResponses(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.pendingCommands.length > 0) {
      const parsed = this.parseResponse(0);

      if (!parsed) {
        return;
      }

      const pendingCommand = this.pendingCommands.shift();
      this.buffer = this.buffer.subarray(parsed.nextOffset);

      if (!pendingCommand) {
        continue;
      }

      if (parsed.value instanceof Error) {
        pendingCommand.reject(parsed.value);
      } else {
        pendingCommand.resolve(parsed.value);
      }
    }
  }

  private parseResponse(
    offset: number,
  ): { value: RedisResponse | Error; nextOffset: number } | null {
    if (this.buffer.length <= offset) {
      return null;
    }

    const type = String.fromCharCode(this.buffer[offset]);
    const lineEnd = this.buffer.indexOf("\r\n", offset);

    if (lineEnd === -1) {
      return null;
    }

    const line = this.buffer.toString("utf8", offset + 1, lineEnd);
    const nextOffset = lineEnd + 2;

    if (type === "+") {
      return { value: line, nextOffset };
    }

    if (type === "-") {
      return { value: new Error(line), nextOffset };
    }

    if (type === ":") {
      return { value: Number(line), nextOffset };
    }

    if (type === "$") {
      const length = Number(line);

      if (length === -1) {
        return { value: null, nextOffset };
      }

      const valueEnd = nextOffset + length;
      const responseEnd = valueEnd + 2;

      if (this.buffer.length < responseEnd) {
        return null;
      }

      return {
        value: this.buffer.toString("utf8", nextOffset, valueEnd),
        nextOffset: responseEnd,
      };
    }

    if (type === "*") {
      const length = Number(line);
      const values: RedisResponse[] = [];
      let cursor = nextOffset;

      for (let index = 0; index < length; index += 1) {
        const parsed = this.parseResponse(cursor);

        if (!parsed) {
          return null;
        }

        if (parsed.value instanceof Error) {
          return parsed;
        }

        values.push(parsed.value);
        cursor = parsed.nextOffset;
      }

      return { value: values, nextOffset: cursor };
    }

    return {
      value: new Error(`Unsupported Redis response type: ${type}`),
      nextOffset,
    };
  }

  private serializeCommand(args: RedisValue[]): string {
    return [
      `*${args.length}`,
      ...args.flatMap((arg) => {
        const value = String(arg);

        return [`$${Buffer.byteLength(value)}`, value];
      }),
      "",
    ].join("\r\n");
  }

  private rejectPending(error: Error): void {
    for (const pendingCommand of this.pendingCommands) {
      pendingCommand.reject(error);
    }

    this.pendingCommands = [];
  }

  private getRetryDelay(attempt: number): number {
    const delay = Math.min(
      BASE_RETRY_DELAY_MS * 2 ** (attempt - 1),
      MAX_RETRY_DELAY_MS,
    );
    const jitter = delay * RETRY_JITTER_PERCENTAGE * Math.random();

    return delay + jitter;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

const redis = new RedisClient();

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

export { redis };
