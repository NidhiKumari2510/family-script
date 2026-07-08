import { APIError } from "better-auth/api";

import { auth } from "@/config/auth";
import type { loginSchema, registerSchema } from "./auth.validators";
import type {
  resendVerificationSchema,
  verifyEmailSchema,
} from "./auth.validators";
import type { z } from "zod";

type RegisterInput = z.infer<typeof registerSchema>;

type RegisterResult =
  | { success: true; userId: string; email: string }
  | { success: false; status: number; message: string };

type LoginInput = z.infer<typeof loginSchema>;

type LoginResult =
  | {
      success: true;
      userId: string;
      email: string;
      setCookieHeader: string | null;
    }
  | { success: false; status: number; message: string };

export const authService = {
  async registerUser(input: RegisterInput): Promise<RegisterResult> {
    try {
      const response = await auth.api.signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
        asResponse: false,
      });

      return {
        success: true,
        userId: response.user.id,
        email: response.user.email,
      };
    } catch (error) {
      if (error instanceof APIError) {
        return {
          success: false,
          status: error.statusCode ?? 400,
          message:
            error.body?.message ?? error.message ?? "Registration failed.",
        };
      }

      throw error;
    }
  },
  async loginUser(input: LoginInput): Promise<LoginResult> {
    try {
      const response = await auth.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
        },
        asResponse: true,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        return {
          success: false,
          status: response.status,
          message: errorBody?.message ?? "Invalid email or password.",
        };
      }

      const data = await response.json();

      return {
        success: true,
        userId: data.user.id,
        email: data.user.email,
        setCookieHeader: response.headers.get("set-cookie"),
      };
    } catch (error) {
      if (error instanceof APIError) {
        return {
          success: false,
          status: error.statusCode ?? 401,
          message: error.body?.message ?? error.message ?? "Login failed.",
        };
      }

      throw error;
    }
  },

  async verifyEmail(input: z.infer<typeof verifyEmailSchema>) {
    try {
      // Validates token, marks user verified
      await auth.api.verifyEmail({
        query: { token: input.token },
      });

      return { success: true as const };
    } catch (error) {
      if (error instanceof APIError) {
        return {
          success: false as const,
          status: error.statusCode ?? 400,
          message:
            error.body?.message ?? error.message ?? "Verification failed.",
        };
      }

      throw error;
    }
  },

  async resendVerification(input: z.infer<typeof resendVerificationSchema>) {
    try {
      // Issues a new token, triggers sendVerificationEmail again
      await auth.api.sendVerificationEmail({
        body: { email: input.email },
      });

      return { success: true as const };
    } catch (error) {
      if (error instanceof APIError) {
        return {
          success: false as const,
          status: error.statusCode ?? 400,
          message:
            error.body?.message ??
            error.message ??
            "Could not resend verification email.",
        };
      }

      throw error;
    }
  },
};
