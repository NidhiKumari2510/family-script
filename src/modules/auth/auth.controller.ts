import { NextResponse } from "next/server";

import { authService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validators";
import {
  authenticate,
  type AuthenticatedRequest,
} from "@/middleware/authenticate";
import { resendVerificationSchema, verifyEmailSchema } from "./auth.validators";
import { forgotPasswordSchema, resetPasswordSchema } from "./auth.validators";

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

  async login(request: Request) {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login payload.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const result = await authService.loginUser(parsed.data);

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status },
        );
      }

      const res = NextResponse.json(
        {
          success: true,
          message: "Login successful.",
          data: { id: result.userId, email: result.email },
        },
        { status: 200 },
      );

      // Forward Better Auth's session cookie to the client so subsequent
      // requests are authenticated.
      if (result.setCookieHeader) {
        res.headers.set("set-cookie", result.setCookieHeader);
      }

      return res;
    } catch (error) {
      console.error("[auth.login] Unexpected error:", error);

      return NextResponse.json(
        { success: false, message: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  },

  async getCurrentUser(request: Request) {
    const nextRequest = request as import("next/server").NextRequest;

    // Validates session, attaches user/session, or returns 401
    const authError = await authenticate(nextRequest);

    if (authError) {
      return authError;
    }

    const { user } = nextRequest as AuthenticatedRequest;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 },
    );
  },

  async verifyEmail(request: Request) {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const result = await authService.verifyEmail(parsed.data);

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status },
        );
      }

      return NextResponse.json(
        { success: true, message: "Email verified successfully." },
        { status: 200 },
      );
    } catch (error) {
      console.error("[auth.verifyEmail] Unexpected error:", error);

      return NextResponse.json(
        { success: false, message: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  },

  async resendVerification(request: Request) {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = resendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const result = await authService.resendVerification(parsed.data);

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status },
        );
      }

      return NextResponse.json(
        { success: true, message: "Verification email sent." },
        { status: 200 },
      );
    } catch (error) {
      console.error("[auth.resendVerification] Unexpected error:", error);

      return NextResponse.json(
        { success: false, message: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  },

  async forgotPassword(request: Request) {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const result = await authService.forgotPassword(parsed.data);

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status },
        );
      }

      return NextResponse.json(
        { success: true, message: "Password reset email sent." },
        { status: 200 },
      );
    } catch (error) {
      console.error("[auth.forgotPassword] Unexpected error:", error);

      return NextResponse.json(
        { success: false, message: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  },

  async resetPassword(request: Request) {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const result = await authService.resetPassword(parsed.data);

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status },
        );
      }

      return NextResponse.json(
        { success: true, message: "Password reset successfully." },
        { status: 200 },
      );
    } catch (error) {
      console.error("[auth.resetPassword] Unexpected error:", error);

      return NextResponse.json(
        { success: false, message: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  },
};
