import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = req.nextUrl;

    const pageRaw = searchParams.get("page") ?? "1";
    const limitRaw = searchParams.get("limit") ?? "20";
    const status = searchParams.get("status") ?? undefined;

    const page = parseInt(pageRaw, 10);
    const limit = parseInt(limitRaw, 10);

    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: "Invalid Query Params" },
        { status: 400 }
      );
    }

    const validStatuses = ["ACTIVE", "DRAFT", "EXPIRED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid Query Params: status must be ACTIVE, DRAFT or EXPIRED" },
        { status: 400 }
      );
    }

    const where: any = {};
    if (status) where.status = status;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          body: true,
          status: true,
          publishedAt: true,
          expiresAt: true,
          createdBy: true,
          createdAt: true,
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        announcements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[ADMIN_ANNOUNCEMENTS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}