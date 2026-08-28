import { describe, expect, it } from "vitest";
import { PERMISSION_CATALOG, PERMISSION_DOMAIN_ORDER, getPermissionDefinition, getPermissionsByDomain } from "@/components/domain/access/permission-catalog";

describe("permission-catalog", () => {
  it("every permission key is unique", () => {
    const keys = PERMISSION_CATALOG.map((permission) => permission.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every permission's domain is a real, ordered domain", () => {
    expect(PERMISSION_CATALOG.every((permission) => PERMISSION_DOMAIN_ORDER.includes(permission.domain))).toBe(true);
  });

  it("getPermissionDefinition resolves a real key and returns undefined for an unknown one", () => {
    expect(getPermissionDefinition("caisse.manage")?.sensitivity).toBe("critical");
    expect(getPermissionDefinition("not.a.real.key")).toBeUndefined();
  });

  it("getPermissionsByDomain returns every permission for that domain, nothing else", () => {
    const financePermissions = getPermissionsByDomain("finance");
    expect(financePermissions.map((permission) => permission.key).sort()).toEqual(
      ["expenses.manage", "invoices.create", "invoices.view", "payments.record"].sort(),
    );
  });

  it("caisse.manage is the sole Caisse permission, matching Screen 47's own single 'Accéder' checkbox — never a finer split", () => {
    expect(getPermissionsByDomain("caisse")).toEqual([
      { key: "caisse.manage", domain: "caisse", labelKey: "access.permission.caisse_manage", sensitivity: "critical", delegatable: false },
    ]);
  });

  it("the 3 access.* governance permissions and caisse.manage and subscription.manage are never delegatable (privilege-escalation / custody / WF-74 reasoning)", () => {
    const nonDelegatable = ["caisse.manage", "subscription.manage", "access.roles.manage", "access.permissions.manage", "access.delegations.manage"];
    for (const key of nonDelegatable) {
      expect(getPermissionDefinition(key)?.delegatable).toBe(false);
    }
  });

  it("every other permission is delegatable", () => {
    const nonDelegatable = new Set(["caisse.manage", "subscription.manage", "access.roles.manage", "access.permissions.manage", "access.delegations.manage"]);
    expect(PERMISSION_CATALOG.filter((permission) => !nonDelegatable.has(permission.key)).every((permission) => permission.delegatable)).toBe(
      true,
    );
  });
});
