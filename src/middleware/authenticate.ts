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
  const sessionCookie = getSessionCookie(request.headers);
  const authorizationHeader = request.headers.get("authorization");
  const hasBearerToken = authorizationHeader?.startsWith("Bearer ");

  if (!sessionCookie && !hasBearerToken) {
    return unauthorizedResponse();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
    query: {
      disableCookieCache: true,
    },
  });

  if (!session?.user) {
    return unauthorizedResponse();
  }

  const authenticatedRequest = request as AuthenticatedRequest;

  authenticatedRequest.user = session.user;
  authenticatedRequest.session = session.session;

  return null;
}
