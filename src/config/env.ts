import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),

  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),

  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),
  PORT: z.coerce.number().int().positive(),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
