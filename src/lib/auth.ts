// src/lib/auth.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function getSessionFromRequest(req: NextRequest) {
  const token =
    req.cookies.get("session_token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return session;
}