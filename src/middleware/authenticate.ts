import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/config/auth";

type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type AuthenticatedUser = AuthSession["user"];

export type AuthenticatedRequest = NextRequest & {
  user: AuthenticatedUser;
  session: AuthSession["session"];
};

const unauthorizedResponse = () =>
  NextResponse.json(
    {
      success: false,
      message: "Unauthorized",
    },
    { status: 401 },
  );

export async function authenticate(
  request: NextRequest,
): Promise<NextResponse | null> {
  // A6: This helper only protects routes that explicitly call it from their handler.
  // Browser requests usually arrive with a Better Auth session cookie.
  const sessionCookie = getSessionCookie(request.headers);
  // Non-browser clients can use the bearer plugin and send Authorization: Bearer xxx.
  const authorizationHeader = request.headers.get("authorization");
  const hasBearerToken = authorizationHeader?.startsWith("Bearer ");

  if (!sessionCookie && !hasBearerToken) {
    return unauthorizedResponse();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
    query: {
      // Force Better Auth to validate against the incoming credentials instead of relying on cookie cache state.
      disableCookieCache: true,
    },
  });

  if (!session?.user) {
    return unauthorizedResponse();
  }

  const authenticatedRequest = request as AuthenticatedRequest;

  // Route handlers that call authenticate can cast to AuthenticatedRequest and read the current user/session.
  authenticatedRequest.user = session.user;
  authenticatedRequest.session = session.session;

  return null;
}
