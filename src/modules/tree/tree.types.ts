
import { TreeType, TreeVisibility, TreeMemberRole } from "@prisma/client";

/**
 * Data required to create a new tree.
 */
export interface CreateTreeInput {
  name: string;
  description?: string;
  type?: TreeType;
  visibility?: TreeVisibility;
  coverImageUrl?: string;
  defaultLanguage?: string;
}

/**
 * Data allowed when updating a tree.
 */
export interface UpdateTreeInput {
  name?: string;
  description?: string;
  visibility?: TreeVisibility;
  coverImageUrl?: string;
  defaultLanguage?: string;
  isArchived?: boolean;
}

/**
 * Filters used while fetching trees.
 */
export interface TreeFilters {
  ownerId?: string;
  type?: TreeType;
  visibility?: TreeVisibility;
  isArchived?: boolean;
}

/**
 * Pagination options.
 */
export interface TreePagination {
  page?: number;
  limit?: number;
}

/**
 * Current authenticated user.
 * Extend this later if your auth system returns more fields.
 */
export interface CurrentUser {
  id: string;
  email: string;
}

/**
 * Used when inviting a member.
 */
export interface InviteMemberInput {
  email: string;
  role: TreeMemberRole;
}

/**
 * Used for updating a member's role.
 */
export interface UpdateMemberRoleInput {
  role: TreeMemberRole;
}