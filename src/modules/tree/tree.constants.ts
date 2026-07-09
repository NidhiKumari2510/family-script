
import { TreeType, TreeVisibility, TreeMemberRole } from "@prisma/client";

/**
 * Default values
 */
export const DEFAULT_TREE_TYPE = TreeType.FAMILY;

export const DEFAULT_TREE_VISIBILITY = TreeVisibility.PRIVATE;

export const DEFAULT_MEMBER_ROLE = TreeMemberRole.OWNER;

export const DEFAULT_LANGUAGE = "en";

/**
 * Validation Limits
 */
export const TREE_NAME_MIN_LENGTH = 3;
export const TREE_NAME_MAX_LENGTH = 100;

export const TREE_DESCRIPTION_MAX_LENGTH = 1000;

export const TREE_SLUG_MIN_LENGTH = 3;
export const TREE_SLUG_MAX_LENGTH = 120;

/**
 * Pagination
 */
export const DEFAULT_PAGE = 1;

export const DEFAULT_LIMIT = 10;

export const MAX_LIMIT = 100;

/**
 * Cover Image
 */
export const ALLOWED_COVER_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB