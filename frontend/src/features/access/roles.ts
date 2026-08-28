import type { AccessRole } from "@/components/domain/access/types";

export function roleHasPermission(role: AccessRole, permissionKey: string): boolean {
  return role.permissionKeys.includes(permissionKey);
}

/** Adds or removes one permission key from a role's own list — the sole mutation this prototype offers on `AccessRole` (task §11: no delete/rename affordance for the 3 protected system roles). */
export function toggleRolePermission(role: AccessRole, permissionKey: string): AccessRole {
  const has = roleHasPermission(role, permissionKey);
  return {
    ...role,
    permissionKeys: has ? role.permissionKeys.filter((key) => key !== permissionKey) : [...role.permissionKeys, permissionKey],
  };
}
