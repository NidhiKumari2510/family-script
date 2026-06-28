import { PrismaClient } from "@prisma/client";

import { env } from "./env";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      env.NODE_ENV === "production"
        ? ["warn", "error"]
        : ["query", "warn", "error"],
  });
};

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof prismaClientSingleton>;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
