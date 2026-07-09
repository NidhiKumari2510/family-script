import { headers } from "next/headers";
import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { successResponse } from "@/lib/api-response";

import { TreeRepository } from "@/modules/tree/tree.repository";
import { TreeService } from "@/modules/tree/tree.service";
import {
  createTreeSchema,
  treeQuerySchema,
} from "@/modules/tree/tree.validator";

const treeRepository = new TreeRepository();
const treeService = new TreeService(treeRepository);

/**
 * GET /api/trees
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const query = treeQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
    });

    const trees = await treeService.getUserTrees(session.user.id);

    return successResponse(
      trees,
      "Trees fetched successfully."
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/trees
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const data = createTreeSchema.parse(body);

    const tree = await treeService.createTree(
      data,
      session.user.id
    );

    return successResponse(
      tree,
      "Tree created successfully.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}