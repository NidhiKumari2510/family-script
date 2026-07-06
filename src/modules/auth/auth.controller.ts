import { NextResponse } from "next/server";

import { authService } from "./auth.service";
import { registerSchema } from "./auth.validators";

export const authController = {
  async register(request: Request) {
    let body: unknown;

    // Parse JSON body
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    // Validate payload shape
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration payload.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const result = await authService.registerUser(parsed.data);

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status },
        );
      }

      // User created; verification email already sent by Better Auth
      return NextResponse.json(
        {
          success: true,
          message: "Registration successful. Please verify your email address.",
          data: {
            id: result.userId,
            email: result.email,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      // Unexpected/server errors
      console.error("[auth.register] Unexpected error:", error);

      return NextResponse.json(
        { success: false, message: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  },
};