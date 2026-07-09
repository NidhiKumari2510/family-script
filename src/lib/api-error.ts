import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

import { errorResponse } from "./api-response";

/**
 * Normalizes thrown errors into the standard API response envelope.
 * Known validation and database errors are mapped to user-friendly messages
 * and HTTP status codes.
 */
export function handleApiError(error: unknown) {
  // Validation failures should return the flattened field error payload.
  if (error instanceof ZodError) {
    return errorResponse("Validation failed.", 400, error.flatten());
  }

  // Prisma request errors are translated into stable API responses.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violations.
        return errorResponse("A record with this value already exists.", 409);

      case "P2025":
        // Attempts to update or delete a record that no longer exists.
        return errorResponse("Record not found.", 404);

      default:
        // Any other Prisma request error falls back to a generic database error.
        return errorResponse("Database error.", 500);
    }
  }

  // Domain or application errors expose their message with a bad-request status.
  if (error instanceof Error) {
    return errorResponse(error.message, 400);
  }

  // Unknown failures are hidden behind a generic 500 response.
  return errorResponse("Internal server error.", 500);
}
