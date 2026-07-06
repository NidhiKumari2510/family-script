import { APIError } from "better-auth/api";

import { auth } from "@/config/auth";
import type { registerSchema } from "./auth.validators";
import type { z } from "zod";

type RegisterInput = z.infer<typeof registerSchema>;

type RegisterResult =
  | { success: true; userId: string; email: string }
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
          message: error.body?.message ?? error.message ?? "Registration failed.",
        };
      }

      throw error;
    }
  },
};