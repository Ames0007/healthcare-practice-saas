import type { TenantMembership, UserAccount } from "@/components/domain/access/types";

const TENANT_ID = "tenant-1";

/**
 * Centralized synthetic UserAccount fixture (UI-011X Gate 2). Every
 * account here links to a real Équipe `TeamMember` (`teamMemberId`,
 * `features/team/mock-data.ts`, UI-007A) rather than an unrelated
 * identity — never a duplicate universe (CLAUDE.md §12's own discipline,
 * applied to identity). Deliberately does *not* cover every TeamMember:
 * Hamza Rifai/Khadija Ziani/Ilham Mernissi have no UserAccount at all,
 * demonstrating this module's own explicit rule — "A TeamMember may
 * exist without a UserAccount" (task §4). Othmane Zouiten's account is
 * `disabled`, matching his own `TeamMember.status === "inactive"` —
 * Spec #3 WF-65 "Deactivate staff user."
 */
export function getUserAccountsMockData(): UserAccount[] {
  return [
    { id: "user-1", displayName: "Youssef Benali", email: "y.benali@cabinet-exemple.test", teamMemberId: "team-1", status: "active" },
    { id: "user-2", displayName: "Amal Idrissi", email: "a.idrissi@cabinet-exemple.test", teamMemberId: "team-2", status: "active" },
    { id: "user-3", displayName: "Meryem Bakkali", email: "meryem@cabinet-exemple.test", teamMemberId: "team-3", status: "active" },
    { id: "user-4", displayName: "Nawal Chaoui", email: "nawal.chaoui@cabinet-exemple.test", teamMemberId: "team-4", status: "active" },
    { id: "user-5", displayName: "Othmane Zouiten", email: "othmane.zouiten@cabinet-exemple.test", teamMemberId: "team-7", status: "disabled" },
  ];
}

/**
 * One membership per account, all in the same single synthetic tenant
 * (task §13: "Do not implement multi-tenant switching"). Meryem Bakkali's
 * own membership reproduces Spec #9 Screen 35's worked example exactly:
 * role-default Patients/Rendez-vous, plus the individual grants
 * (Factures/Encaissements) and one restriction Screen 35's own checkbox
 * layout implies beyond the bare role — matching the task's own "2
 * permissions supplémentaires / 1 restriction" wireframe figures (§14)
 * precisely.
 */
export function getTenantMembershipsMockData(): TenantMembership[] {
  return [
    {
      id: "membership-1",
      userId: "user-1",
      tenantId: TENANT_ID,
      roleIds: ["role-owner-admin"],
      individualGrants: [],
      individualRestrictions: [],
      active: true,
    },
    {
      id: "membership-2",
      userId: "user-2",
      tenantId: TENANT_ID,
      roleIds: ["role-practitioner"],
      individualGrants: [],
      individualRestrictions: [],
      active: true,
    },
    {
      id: "membership-3",
      userId: "user-3",
      tenantId: TENANT_ID,
      roleIds: ["role-receptionist"],
      individualGrants: ["invoices.view", "payments.record"],
      individualRestrictions: ["patients.edit_admin"],
      active: true,
    },
    {
      id: "membership-4",
      userId: "user-4",
      tenantId: TENANT_ID,
      roleIds: ["role-receptionist"],
      individualGrants: [],
      individualRestrictions: [],
      active: true,
    },
    {
      id: "membership-5",
      userId: "user-5",
      tenantId: TENANT_ID,
      roleIds: ["role-practitioner"],
      individualGrants: [],
      individualRestrictions: [],
      active: false,
    },
  ];
}
