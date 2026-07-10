import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        avatarUrl: true,
        createdAt: true,
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User Not Found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.name,
        email: user.email,
        isVerified: user.emailVerified,
        profilePhoto: user.avatarUrl ?? null,
        createdAt: user.createdAt,
        lastLoginAt: user.sessions[0]?.createdAt ?? null,
      },
    });
  } catch (error) {
    console.error("[ADMIN_USER_GET_BY_ID]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}