import { headers } from "next/headers";
import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { successResponse } from "@/lib/api-response";

import { TreeRepository } from "@/modules/tree/tree.repository";
import { TreeService } from "@/modules/tree/tree.service";
import {
  treeIdSchema,
  updateTreeSchema,
} from "@/modules/tree/tree.validator";

const treeRepository = new TreeRepository();
const treeService = new TreeService(treeRepository);

/**
 * GET /api/trees/:treeId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ treeId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { treeId } = treeIdSchema.parse(await params);

    const tree = await treeService.getTreeById(treeId, session.user.id);

    return successResponse(
      tree,
      "Tree fetched successfully."
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/trees/:treeId
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ treeId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { treeId } = treeIdSchema.parse(await params);

    const body = await request.json();

    const data = updateTreeSchema.parse(body);

    const tree = await treeService.updateTree(
      treeId,
      data
    );

    return successResponse(
      tree,
      "Tree updated successfully."
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/trees/:treeId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ treeId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { treeId } = treeIdSchema.parse(await params);

    await treeService.deleteTree(treeId);

    return successResponse(
      null,
      "Tree deleted successfully."
    );
  } catch (error) {
    return handleApiError(error);
  }
}