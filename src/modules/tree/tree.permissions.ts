// src/modules/tree/tree.permissions.ts

import { TreeMemberRole } from "@prisma/client";

/**
 * Permission hierarchy
 *
 * OWNER
 * ├── ADMIN
 * │   ├── EDITOR
 * │   │   ├── CONTRIBUTOR
 * │   │   │   └── VIEWER
 */

export function isOwner(role: TreeMemberRole): boolean {
  return role === TreeMemberRole.OWNER;
}

export function isAdmin(role: TreeMemberRole): boolean {
  return [
    TreeMemberRole.OWNER,
    TreeMemberRole.ADMIN,
  ].includes(role);
}

export function canEditTree(role: TreeMemberRole): boolean {
  return [
    TreeMemberRole.OWNER,
    TreeMemberRole.ADMIN,
    TreeMemberRole.EDITOR,
  ].includes(role);
}

export function canManageMembers(role: TreeMemberRole): boolean {
  return [
    TreeMemberRole.OWNER,
    TreeMemberRole.ADMIN,
  ].includes(role);
}

export function canDeleteTree(role: TreeMemberRole): boolean {
  return role === TreeMemberRole.OWNER;
}

export function canInviteMembers(role: TreeMemberRole): boolean {
  return [
    TreeMemberRole.OWNER,
    TreeMemberRole.ADMIN,
  ].includes(role);
}

export function canViewTree(role: TreeMemberRole): boolean {
  return [
    TreeMemberRole.OWNER,
    TreeMemberRole.ADMIN,
    TreeMemberRole.EDITOR,
    TreeMemberRole.CONTRIBUTOR,
    TreeMemberRole.VIEWER,
  ].includes(role);
}