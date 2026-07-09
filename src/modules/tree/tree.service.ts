import slugify from "slugify";

import { TreeRepository } from "./tree.repository";
import { CreateTreeInput, UpdateTreeInput } from "./tree.types";
import { TreeAlreadyExistsError, TreeNotFoundError } from "./tree.errors";

export class TreeService {
  constructor(private readonly treeRepository: TreeRepository) {}

  /**
   * Creates a tree, derives a stable slug from the tree name, and assigns
   * the current user as the owner.
   */
  async createTree(data: CreateTreeInput, ownerId: string) {
    const slug = slugify(data.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const slugExists = await this.treeRepository.slugExists(slug);

    if (slugExists) {
      throw new TreeAlreadyExistsError(data.name);
    }

    return this.treeRepository.create({
      ...data,
      slug,
      owner: {
        connect: {
          id: ownerId,
        },
      },
    });
  }

  /**
   * Loads a tree by its database id and throws a domain error when missing.
   * The userId parameter is reserved for access checks at the service layer.
   */
  async getTreeById(treeId: string, userId: string) {
    const tree = await this.treeRepository.findById(treeId);

    if (!tree) {
      throw new TreeNotFoundError();
    }

    return tree;
  }

  /**
   * Loads a tree by slug for public or route-based lookups.
   */
  async getTreeBySlug(slug: string) {
    const tree = await this.treeRepository.findBySlug(slug);

    if (!tree) {
      throw new TreeNotFoundError();
    }

    return tree;
  }

  /**
   * Returns the trees owned by a user, filtered and ordered by the repository.
   */
  async getUserTrees(ownerId: string) {
    return this.treeRepository.findByOwner(ownerId);
  }

  /**
   * Updates editable tree fields after confirming the tree still exists.
   */
  async updateTree(id: string, userId: string, data: UpdateTreeInput) {
    await this.getTreeById(id);

    return this.treeRepository.update(id, data);
  }

  /**
   * Marks the tree as archived so it is hidden from normal use without
   * removing the record.
   */
  async archiveTree(id: string) {
    await this.getTreeById(id);

    return this.treeRepository.update(id, {
      isArchived: true,
    });
  }

  /**
   * Reverses an archive operation by restoring the tree record.
   */
  async restoreTree(id: string) {
    await this.getTreeById(id);

    return this.treeRepository.restore(id);
  }

  /**
   * Soft deletes a tree so it can be recovered later if needed.
   */
  async deleteTree(treeId: string, userId: string) {
    await this.getTreeById(treeId);

    return this.treeRepository.softDelete(treeId);
  }
}
