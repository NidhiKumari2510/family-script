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

    const about = await prisma.aboutContent.findFirst();

    if (!about) {
      return NextResponse.json(
        { success: false, message: "Content Not Found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: about.id,
        title: about.title,
        body: about.body,
        updatedAt: about.updatedAt,
        updatedBy: about.updatedBy,
      },
    });
  } catch (error) {
    console.error("[ADMIN_CONTENT_ABOUT_GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, body: bodyText } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length < 3 || title.trim().length > 150) {
      return NextResponse.json(
        { success: false, message: "Validation Error: title is required and must be 3-150 characters" },
        { status: 400 }
      );
    }

    if (!bodyText || typeof bodyText !== "string" || bodyText.trim().length < 10 || bodyText.trim().length > 5000) {
      return NextResponse.json(
        { success: false, message: "Validation Error: body is required and must be 10-5000 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.aboutContent.findFirst();

    await prisma.$transaction(async (tx) => {
      await tx.aboutContent.upsert({
        where: { id: existing?.id ?? "about_1" },
        update: {
          title: title.trim(),
          body: bodyText.trim(),
          updatedBy: session?.userId ?? "usr_001",
        },
        create: {
          id: "about_1",
          title: title.trim(),
          body: bodyText.trim(),
          updatedBy: session?.userId ?? "usr_001",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session?.userId ?? null,
          action: "UPDATE_ABOUT_CONTENT",
          entityType: "AboutContent",
          entityId: existing?.id ?? "about_1",
          metadata: { title, body: bodyText },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "About section updated",
    });
  } catch (error) {
    console.error("[ADMIN_CONTENT_ABOUT_PATCH]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}