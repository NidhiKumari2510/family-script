import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
   { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const body = await req.json();
    const { status } = body;

    const allowedStatuses = ["ACTIVE", "SUSPENDED"];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid Status Value" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User Not Found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: status === "SUSPENDED" ? new Date() : null },
      });

      if (status === "SUSPENDED") {
        await tx.session.deleteMany({
          where: { userId },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session?.userId ?? null,
          action: "UPDATE_USER_STATUS",
          entityType: "User",
          entityId: userId,
          metadata: { newStatus: status },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "User status updated",
    });
  } catch (error) {
    console.error("[ADMIN_USER_UPDATE_STATUS]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}