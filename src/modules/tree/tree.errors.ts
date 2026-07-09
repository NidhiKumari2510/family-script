/**
 * Thrown when a tree lookup does not return a matching record.
 * Use this to translate missing resources into a 404-style response.
 */
export class TreeNotFoundError extends Error {
  constructor() {
    super("Tree not found.");
    this.name = "TreeNotFoundError";
  }
}

/**
 * Thrown when a tree with the same display name already exists in the
 * relevant scope.
 */
export class TreeAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`A tree named "${name}" already exists.`);
    this.name = "TreeAlreadyExistsError";
  }
}

/**
 * Thrown when a tree slug conflicts with another tree's slug.
 */
export class TreeSlugAlreadyExistsError extends Error {
  constructor(slug: string) {
    super(`The slug "${slug}" is already in use.`);
    this.name = "TreeSlugAlreadyExistsError";
  }
}

/**
 * Thrown when the authenticated user is not allowed to access the tree.
 */
export class TreeAccessDeniedError extends Error {
  constructor() {
    super("You do not have permission to access this tree.");
    this.name = "TreeAccessDeniedError";
  }
}

/**
 * Thrown when a tree is archived and the requested operation is no longer
 * permitted.
 */
export class TreeArchivedError extends Error {
  constructor() {
    super("This tree has been archived.");
    this.name = "TreeArchivedError";
  }
}

/**
 * Thrown when a membership record already exists for the user.
 */
export class MemberAlreadyExistsError extends Error {
  constructor() {
    super("User is already a member of this tree.");
    this.name = "MemberAlreadyExistsError";
  }
}

/**
 * Thrown when an owner tries to leave or delete a tree before transferring
 * ownership to someone else.
 */
export class OwnerTransferRequiredError extends Error {
  constructor() {
    super("Transfer ownership before leaving or deleting this tree.");
    this.name = "OwnerTransferRequiredError";
  }
}

/**
 * Thrown for tree operations that fail validation but do not fit a more
 * specific domain error.
 */
export class InvalidTreeOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTreeOperationError";
  }
}
