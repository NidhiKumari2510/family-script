import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";

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

const getBearerToken = (request: NextRequest): string | null => {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  return token.length > 0 ? token : null;
};

export async function authenticate(
  request: NextRequest,
): Promise<NextResponse | null> {
  const sessionCookie = getSessionCookie(request.headers);
  const bearerToken = sessionCookie ? null : getBearerToken(request);

  if (!sessionCookie && !bearerToken) {
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
