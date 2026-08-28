import type { AccessRole } from "@/components/domain/access/types";

/**
 * Centralized synthetic role fixture (UI-011X Gate 1) — exactly the 3
 * conceptual V1 roles Spec #2 §29.1 defines, no more (task §9: "Do not
 * invent excessive role proliferation").
 *
 * Owner/Admin: every permission in the catalog (Spec #2 §58: "Full
 * application access... Subscription/referral... Permissions...
 * Financial/HR access... Clinical access"). Practitioner: own agenda +
 * own governed clinical access + admin patient visibility + reports —
 * "Other financial/HR access is configurable" (§58), so nothing else is
 * granted by default. Receptionist/Staff: administrative patient info +
 * appointments only by default — "Optional permissions granted by
 * Owner... Clinical access should not be casually enabled" (§58); every
 * other capability (Invoices/Payments/Caisse/...) reaches a specific
 * receptionist only through an individual grant, never the role itself
 * — reproduced exactly by `mock-users-data.ts`'s own Meryem Bakkali
 * fixture, which mirrors Spec #9 Screen 35's worked example.
 */
export function getAccessRolesMockData(): AccessRole[] {
  return [
    {
      id: "role-owner-admin",
      nameKey: "access.roles.ownerAdmin.name",
      descriptionKey: "access.roles.ownerAdmin.description",
      permissionKeys: [
        "patients.view_admin",
        "patients.edit_admin",
        "clinical.view",
        "clinical.edit",
        "appointments.manage",
        "invoices.view",
        "invoices.create",
        "payments.record",
        "expenses.manage",
        "caisse.manage",
        "hr.manage",
        "payroll.view",
        "commissions.manage",
        "inventory.manage",
        "communication.view",
        "communication.manage",
        "reports.view",
        "settings.manage",
        "subscription.view",
        "subscription.manage",
        "access.roles.manage",
        "access.permissions.manage",
        "access.delegations.manage",
      ],
      systemRole: true,
      active: true,
    },
    {
      id: "role-practitioner",
      nameKey: "access.roles.practitioner.name",
      descriptionKey: "access.roles.practitioner.description",
      permissionKeys: ["appointments.manage", "clinical.view", "clinical.edit", "patients.view_admin", "reports.view"],
      systemRole: true,
      active: true,
    },
    {
      id: "role-receptionist",
      nameKey: "access.roles.receptionist.name",
      descriptionKey: "access.roles.receptionist.description",
      permissionKeys: ["patients.view_admin", "patients.edit_admin", "appointments.manage"],
      systemRole: true,
      active: true,
    },
  ];
}
