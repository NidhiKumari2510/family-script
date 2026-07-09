
import { z } from "zod";
import { TreeType, TreeVisibility, TreeMemberRole } from "@prisma/client";

import {
  TREE_NAME_MIN_LENGTH,
  TREE_NAME_MAX_LENGTH,
  TREE_DESCRIPTION_MAX_LENGTH,
} from "./tree.constants";

/**
 * Create Tree
 */
export const createTreeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(TREE_NAME_MIN_LENGTH, `Tree name must be at least ${TREE_NAME_MIN_LENGTH} characters.`)
    .max(TREE_NAME_MAX_LENGTH, `Tree name cannot exceed ${TREE_NAME_MAX_LENGTH} characters.`),

  description: z
    .string()
    .trim()
    .max(
      TREE_DESCRIPTION_MAX_LENGTH,
      `Description cannot exceed ${TREE_DESCRIPTION_MAX_LENGTH} characters.`
    )
    .optional(),

  type: z.nativeEnum(TreeType).optional(),

  visibility: z.nativeEnum(TreeVisibility).optional(),

  coverImageUrl: z.string().url().optional(),

  defaultLanguage: z.string().trim().min(2).max(10).optional(),
});

/**
 * Update Tree
 */
export const updateTreeSchema = createTreeSchema
  .partial()
  .extend({
    isArchived: z.boolean().optional(),
  });

/**
 * Invite Member
 */
export const inviteMemberSchema = z.object({
  email: z.email().trim(),

  role: z.nativeEnum(TreeMemberRole),
});

/**
 * Update Member Role
 */
export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(TreeMemberRole),
});

/**
 * Tree ID Param
 */
export const treeIdSchema = z.object({
  treeId: z.cuid(),
});

/**
 * Pagination Query
 */
export const treePaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * Search Query
 */
export const treeSearchSchema = z.object({
  search: z.string().trim().optional(),
});

/**
 * Combined Query Schema
 */
export const treeQuerySchema = treePaginationSchema.merge(treeSearchSchema);

/**
 * Export inferred types
 */
export type CreateTreeSchema = z.infer<typeof createTreeSchema>;
export type UpdateTreeSchema = z.infer<typeof updateTreeSchema>;
export type InviteMemberSchema = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleSchema = z.infer<typeof updateMemberRoleSchema>;
export type TreeQuerySchema = z.infer<typeof treeQuerySchema>;