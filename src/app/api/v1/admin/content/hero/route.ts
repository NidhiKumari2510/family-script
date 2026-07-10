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

    const hero = await prisma.heroContent.findFirst();

    if (!hero) {
      return NextResponse.json(
        { success: false, message: "Content Not Found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: hero.id,
        heading: hero.heading,
        subheading: hero.subheading,
        ctaText: hero.ctaText,
        ctaUrl: hero.ctaUrl,
        updatedAt: hero.updatedAt,
        updatedBy: hero.updatedBy,
      },
    });
  } catch (error) {
    console.error("[ADMIN_CONTENT_HERO_GET]", error);
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
    const { heading, subheading, ctaText, ctaUrl } = body;

    // Validation
    if (!heading || typeof heading !== "string" || heading.trim().length < 3 || heading.trim().length > 150) {
      return NextResponse.json(
        { success: false, message: "Validation Error: heading is required and must be 3-150 characters" },
        { status: 400 }
      );
    }

    if (subheading && subheading.length > 300) {
      return NextResponse.json(
        { success: false, message: "Validation Error: subheading must be max 300 characters" },
        { status: 400 }
      );
    }

    if (ctaText && ctaText.length > 50) {
      return NextResponse.json(
        { success: false, message: "Validation Error: ctaText must be max 50 characters" },
        { status: 400 }
      );
    }

    if (ctaUrl) {
      const isValidUrl =
        ctaUrl.startsWith("/") ||
        ctaUrl.startsWith("http://") ||
        ctaUrl.startsWith("https://");
      if (!isValidUrl) {
        return NextResponse.json(
          { success: false, message: "Validation Error: ctaUrl must be a valid relative or absolute URL" },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.heroContent.findFirst();

    await prisma.$transaction(async (tx) => {
      await tx.heroContent.upsert({
        where: { id: existing?.id ?? "hero_1" },
        update: {
          heading: heading.trim(),
          ...(subheading !== undefined && { subheading }),
          ...(ctaText !== undefined && { ctaText }),
          ...(ctaUrl !== undefined && { ctaUrl }),
          updatedBy: session?.userId ?? "usr_001",
        },
        create: {
          id: "hero_1",
          heading: heading.trim(),
          subheading: subheading ?? "",
          ctaText: ctaText ?? "Get Started",
          ctaUrl: ctaUrl ?? "/register",
          updatedBy: session?.userId ?? "usr_001",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session?.userId ?? null,
          action: "UPDATE_HERO_CONTENT",
          entityType: "HeroContent",
          entityId: existing?.id ?? "hero_1",
          metadata: { heading, subheading, ctaText, ctaUrl },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Hero section updated",
    });
  } catch (error) {
    console.error("[ADMIN_CONTENT_HERO_PATCH]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}