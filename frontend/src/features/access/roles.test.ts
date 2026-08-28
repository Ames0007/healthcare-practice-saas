import { describe, expect, it } from "vitest";
import type { AccessRole } from "@/components/domain/access/types";
import { roleHasPermission, toggleRolePermission } from "./roles";

const baseRole: AccessRole = {
  id: "role-x",
  nameKey: "x",
  descriptionKey: "x",
  permissionKeys: ["patients.view_admin"],
  systemRole: true,
  active: true,
};

describe("roles", () => {
  it("roleHasPermission reflects the role's own permissionKeys", () => {
    expect(roleHasPermission(baseRole, "patients.view_admin")).toBe(true);
    expect(roleHasPermission(baseRole, "caisse.manage")).toBe(false);
  });

  it("toggleRolePermission adds a key that isn't present", () => {
    const updated = toggleRolePermission(baseRole, "caisse.manage");
    expect(updated.permissionKeys).toContain("caisse.manage");
    expect(updated.permissionKeys).toContain("patients.view_admin");
  });

  it("toggleRolePermission removes a key that is present", () => {
    const updated = toggleRolePermission(baseRole, "patients.view_admin");
    expect(updated.permissionKeys).not.toContain("patients.view_admin");
  });

  it("toggleRolePermission never mutates the original role", () => {
    toggleRolePermission(baseRole, "caisse.manage");
    expect(baseRole.permissionKeys).toEqual(["patients.view_admin"]);
  });
});
