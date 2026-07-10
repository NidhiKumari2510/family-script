import { NextResponse } from "next/server";

import { prisma } from "@/config/database";
import {
  hasPermission,
  type AuthPermission,
} from "@/shared/auth/permissions";
import { isAuthRole, type AuthRole } from "@/shared/auth/roles";

export type AuthorizeInput = {
  userId: string;
  treeId: string;
  permission: AuthPermission;
};

export type AuthorizationResult =
  | {
      authorized: true;
      role: AuthRole;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

const forbiddenResponse = () =>
  NextResponse.json(
    {
      success: false,
      message: "Forbidden",
    },
    { status: 403 },
  );

export async function authorize(
  input: AuthorizeInput,
): Promise<AuthorizationResult> {
  const membership = await prisma.treeMember.findUnique({
    where: {
      treeId_userId: {
        treeId: input.treeId,
        userId: input.userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership || !isAuthRole(membership.role)) {
    return {
      authorized: false,
      response: forbiddenResponse(),
    };
  }

  if (!hasPermission(membership.role, input.permission)) {
    return {
      authorized: false,
      response: forbiddenResponse(),
    };
  }

  return {
    authorized: true,
    role: membership.role,
  };
}
