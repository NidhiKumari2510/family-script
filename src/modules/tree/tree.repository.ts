
import { Prisma, Tree } from "@prisma/client";

import { PrismaClient } from "@prisma/client";

export class TreeRepository {
    constructor(private readonly db: PrismaClient) {}
  /**
   * Create a new tree
   */
  async create(data: Prisma.TreeCreateInput): Promise<Tree> {
    return this.db.tree.create({
      data,
    });
  }

  /**
   * Find tree by ID
   */
  async findById(id: string): Promise<Tree | null> {
    return this.db.tree.findUnique({
      where: { id },
    });
  }

  /**
   * Find tree by slug
   */
  async findBySlug(slug: string): Promise<Tree | null> {
    return this.db.tree.findUnique({
      where: { slug },
    });
  }

  /**
   * Find all trees owned by a user
   */
  async findByOwner(ownerId: string): Promise<Tree[]> {
    return this.db.tree.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Update tree
   */
  async update(
    id: string,
    data: Prisma.TreeUpdateInput
  ): Promise<Tree> {
    return this.db.tree.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete tree
   */
  async softDelete(id: string): Promise<Tree> {
    return this.db.tree.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Restore tree
   */
  async restore(id: string): Promise<Tree> {
    return this.db.tree.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string): Promise<boolean> {
    const tree = await this.db.tree.findUnique({
      where: { slug },
      select: { id: true },
    });

    return !!tree;
  }

  /**
   * Check if tree exists
   */
  async exists(id: string): Promise<boolean> {
    const tree = await this.db.tree.findUnique({
      where: { id },
      select: { id: true },
    });

    return !!tree;
  }
}