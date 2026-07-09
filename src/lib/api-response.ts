import { NextResponse } from "next/server";

/**
 * Standard API response envelope used by route handlers.
 * The generic payload keeps success responses type-safe.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

/**
 * Builds a successful JSON response with a consistent payload shape.
 */
export function successResponse<T>(
  data: T,
  message = "Request completed successfully.",
  status = 200,
) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

/**
 * Builds a failure JSON response and optionally attaches structured errors.
 */
export function errorResponse(
  message = "Something went wrong.",
  status = 500,
  errors?: unknown,
) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      message,
      errors,
    },
    { status },
  );
}
