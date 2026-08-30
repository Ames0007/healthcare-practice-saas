import { describe, expect, it } from "vitest";
import type { TenantMembership, UserAccount } from "@/components/domain/access/types";
import type { PlatformUser, PlatformUserTenantMembership, Tenant } from "@/components/domain/platform-admin/types";
import {
  applyUserAction,
  buildPlatformUserRows,
  computePlatformUserKpis,
  countTenantUsers,
  findTenantOwnerName,
  getAvailableUserActions,
  mapAccessUsersToPlatformUsers,
} from "./platform-users";

const TENANT: Tenant = { id: "tenant-1", name: "Cabinet (exemple)", slug: "cabinet-exemple", specialty: "general_medicine", status: "active", createdAt: "2026-02-23" };

const ACCESS_USERS: UserAccount[] = [
  { id: "user-1", displayName: "Owner Person", email: "owner@test.test", status: "active" },
  { id: "user-2", displayName: "Disabled Person", email: "disabled@test.test", status: "disabled" },
];

const ACCESS_MEMBERSHIPS: TenantMembership[] = [
  { id: "membership-1", userId: "user-1", tenantId: "tenant-1", roleIds: ["role-owner-admin"], individualGrants: [], individualRestrictions: [], active: true },
  { id: "membership-2", userId: "user-2", tenantId: "tenant-1", roleIds: ["role-practitioner"], individualGrants: [], individualRestrictions: [], active: false },
];

describe("mapAccessUsersToPlatformUsers", () => {
  const { users, memberships } = mapAccessUsersToPlatformUsers(ACCESS_USERS, ACCESS_MEMBERSHIPS, TENANT);

  it("carries every access UserAccount over 1:1, reusing status/email/displayName verbatim", () => {
    expect(users).toHaveLength(2);
    expect(users[0]).toMatchObject({ id: "user-1", displayName: "Owner Person", email: "owner@test.test", status: "active" });
  });

  it("maps role-owner-admin to profileType owner_admin and marks isOwner true", () => {
    expect(memberships[0]).toMatchObject({ userId: "user-1", tenantId: "tenant-1", profileType: "owner_admin", isOwner: true });
  });

  it("maps role-practitioner to profileType practitioner, never owner", () => {
    expect(memberships[1]).toMatchObject({ profileType: "practitioner", isOwner: false });
  });

  it("maps membership.active=false to platform status disabled", () => {
    expect(memberships[1].status).toBe("disabled");
  });

  it("uses the tenant's own createdAt as joinedAt (no source field exists on TenantMembership)", () => {
    expect(memberships[0].joinedAt).toBe("2026-02-23");
  });
});

describe("buildPlatformUserRows / findTenantOwnerName / countTenantUsers", () => {
  const users: PlatformUser[] = [
    { id: "u-1", displayName: "Multi Tenant User", email: "multi@test.test", status: "active", preferredLanguage: "fr" },
  ];
  const memberships: PlatformUserTenantMembership[] = [
    { id: "m-1", userId: "u-1", tenantId: "t-1", profileType: "owner_admin", isOwner: true, status: "active", joinedAt: "2026-01-01" },
    { id: "m-2", userId: "u-1", tenantId: "t-2", profileType: "practitioner", isOwner: false, status: "active", joinedAt: "2026-03-01" },
  ];
  const tenants: Tenant[] = [
    { id: "t-1", name: "Cabinet One", slug: "one", specialty: "general_medicine", status: "active", createdAt: "2026-01-01" },
    { id: "t-2", name: "Cabinet Two", slug: "two", specialty: "dentistry", status: "active", createdAt: "2026-01-01" },
  ];

  it("carries every tenant relationship a user holds, never collapsing to one row per tenant", () => {
    const rows = buildPlatformUserRows(users, memberships, tenants);
    expect(rows).toHaveLength(1);
    expect(rows[0].memberships).toHaveLength(2);
    expect(rows[0].memberships.map((m) => m.tenantName)).toEqual(["Cabinet One", "Cabinet Two"]);
  });

  it("findTenantOwnerName resolves the isOwner membership's display name", () => {
    expect(findTenantOwnerName("t-1", memberships, users)).toBe("Multi Tenant User");
  });

  it("findTenantOwnerName returns null, never a placeholder string, when no owner is modeled", () => {
    expect(findTenantOwnerName("t-3", memberships, users)).toBeNull();
  });

  it("countTenantUsers counts memberships per tenant independently", () => {
    expect(countTenantUsers("t-1", memberships)).toBe(1);
    expect(countTenantUsers("t-2", memberships)).toBe(1);
  });
});

describe("computePlatformUserKpis", () => {
  it("counts total and active users", () => {
    const users: PlatformUser[] = [
      { id: "1", displayName: "A", email: "a@t.test", status: "active", preferredLanguage: "fr" },
      { id: "2", displayName: "B", email: "b@t.test", status: "invited", preferredLanguage: "fr" },
      { id: "3", displayName: "C", email: "c@t.test", status: "disabled", preferredLanguage: "fr" },
    ];
    expect(computePlatformUserKpis(users)).toEqual({ totalCount: 3, activeCount: 1 });
  });
});

describe("platform user-status actions", () => {
  it("active offers only disable", () => {
    expect(getAvailableUserActions("active")).toEqual(["user.disabled"]);
  });

  it("disabled offers only reactivate", () => {
    expect(getAvailableUserActions("disabled")).toEqual(["user.reactivated"]);
  });

  it("locked offers only unlock", () => {
    expect(getAvailableUserActions("locked")).toEqual(["user.unlocked"]);
  });

  it("invited offers no status action — invitation is account creation, not a status transition", () => {
    expect(getAvailableUserActions("invited")).toEqual([]);
  });

  it("applyUserAction(user.disabled) moves active to disabled", () => {
    const user: PlatformUser = { id: "1", displayName: "A", email: "a@t.test", status: "active", preferredLanguage: "fr" };
    expect(applyUserAction(user, "user.disabled").status).toBe("disabled");
  });

  it("applyUserAction(user.unlocked) moves locked to active", () => {
    const user: PlatformUser = { id: "1", displayName: "A", email: "a@t.test", status: "locked", preferredLanguage: "fr" };
    expect(applyUserAction(user, "user.unlocked").status).toBe("active");
  });
});
