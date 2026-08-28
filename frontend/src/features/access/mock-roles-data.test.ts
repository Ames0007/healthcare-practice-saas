import { describe, expect, it } from "vitest";
import { PERMISSION_CATALOG } from "@/components/domain/access/permission-catalog";
import { getAccessRolesMockData } from "./mock-roles-data";

describe("mock-roles-data", () => {
  it("implements exactly the 3 V1 conceptual roles (Spec #2 §29.1) — no role proliferation", () => {
    expect(getAccessRolesMockData()).toHaveLength(3);
  });

  it("role ids are unique", () => {
    const roles = getAccessRolesMockData();
    expect(new Set(roles.map((role) => role.id)).size).toBe(roles.length);
  });

  it("every permission key on every role resolves to a real catalog entry", () => {
    const catalogKeys = new Set(PERMISSION_CATALOG.map((permission) => permission.key));
    for (const role of getAccessRolesMockData()) {
      expect(role.permissionKeys.every((key) => catalogKeys.has(key))).toBe(true);
    }
  });

  it("Owner/Admin holds every permission in the catalog (Spec #2 §58: full application access)", () => {
    const ownerAdmin = getAccessRolesMockData().find((role) => role.id === "role-owner-admin")!;
    expect(ownerAdmin.permissionKeys.sort()).toEqual(PERMISSION_CATALOG.map((permission) => permission.key).sort());
  });

  it("Practitioner's default access excludes Finance/Caisse/HR/Payroll/Settings — 'other access is configurable' (Spec #2 §58)", () => {
    const practitioner = getAccessRolesMockData().find((role) => role.id === "role-practitioner")!;
    expect(practitioner.permissionKeys).not.toContain("invoices.view");
    expect(practitioner.permissionKeys).not.toContain("caisse.manage");
    expect(practitioner.permissionKeys).not.toContain("hr.manage");
    expect(practitioner.permissionKeys).not.toContain("settings.manage");
  });

  it("Receptionist's default access excludes clinical entirely — 'clinical access should not be casually enabled' (Spec #2 §58)", () => {
    const receptionist = getAccessRolesMockData().find((role) => role.id === "role-receptionist")!;
    expect(receptionist.permissionKeys).not.toContain("clinical.view");
    expect(receptionist.permissionKeys).not.toContain("clinical.edit");
  });

  it("all 3 roles are marked as protected system roles", () => {
    expect(getAccessRolesMockData().every((role) => role.systemRole)).toBe(true);
  });
});
