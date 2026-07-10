export const AUTH_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  CONTRIBUTOR: "CONTRIBUTOR",
  VIEWER: "VIEWER",
} as const;

export type AuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];

export const ROLE_MATRIX = {
  [AUTH_ROLES.OWNER]: 5,
  [AUTH_ROLES.ADMIN]: 4,
  [AUTH_ROLES.EDITOR]: 3,
  [AUTH_ROLES.CONTRIBUTOR]: 2,
  [AUTH_ROLES.VIEWER]: 1,
} as const satisfies Record<AuthRole, number>;

export function isAuthRole(role: string): role is AuthRole {
  return Object.values(AUTH_ROLES).includes(role as AuthRole);
}
