import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(100, "Name must contain at most 100 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must contain at least 8 characters").max(72, "Password must contain at most 72 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Token is required"),
  password: z.string().min(8, "Password must contain at least 8 characters").max(72, "Password must contain at most 72 characters"),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, "Token is required"),
});
