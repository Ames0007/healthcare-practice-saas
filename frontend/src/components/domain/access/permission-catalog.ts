import type { PermissionDefinition, PermissionDomain } from "./types";

/**
 * Centralized permission catalog (UI-011X Gate 1, task §6, Spec #5 §39:
 * "Centralize plan checks... do not scatter checks throughout application
 * code" — the same discipline `features/subscription/entitlements.ts`
 * already applies to plan entitlements, applied here to user access).
 *
 * The 16 core keys (everything through `settings.manage` below) are
 * copied verbatim from two independent, mutually-confirming sources —
 * Spec #4 §4.3 `membership_permissions`'s own "Examples:" list and
 * CLAUDE.md §9's identical list — rather than the deeper, more granular
 * scheme the task's own §6 sketches (e.g. `clinical.profile.view` /
 * `clinical.history.view` / `clinical.consultation.manage` as three
 * separate keys). The task's own text explicitly defers to this: "Do not
 * blindly use this list. Inspect actual implemented capabilities and
 * governing specifications first." Spec #9 Screen 35's own worked
 * example reinforces the coarser grain directly — "CAISSE [x] Accéder"
 * is one checkbox, not four, matching `caisse.manage` here rather than
 * the task's own suggested `caisse.view`/`caisse.open`/`caisse.close`/
 * `caisse.discrepancy.approve` split (ADR-011).
 *
 * Seven keys extend the base list for modules that postdate it (this
 * app's own Communication, Subscription and Access Governance modules
 * have no representation in Spec #4 §4.3/CLAUDE.md §9 at all) — each new
 * key stays at the same coarse grain as its neighbors rather than
 * inventing a deeper scheme just for the new modules.
 *
 * `delegatable: false` is reserved for permissions where temporarily
 * transferring the capability is itself a governance risk beyond normal
 * "cover for an absence" delegation: `caisse.manage` (physical cash
 * custody is tied to a specific accountable person), the three
 * `access.*` keys (delegating the ability to change permissions/create
 * delegations is a direct privilege-escalation path), and
 * `subscription.manage` (Spec #3 WF-74's own "Staff should not be able
 * to upgrade subscription unless authorized").
 */
export const PERMISSION_CATALOG: PermissionDefinition[] = [
  { key: "patients.view_admin", domain: "patients", labelKey: "access.permission.patients_view_admin", sensitivity: "normal", delegatable: true },
  { key: "patients.edit_admin", domain: "patients", labelKey: "access.permission.patients_edit_admin", sensitivity: "normal", delegatable: true },

  { key: "clinical.view", domain: "clinical", labelKey: "access.permission.clinical_view", sensitivity: "sensitive", delegatable: true },
  { key: "clinical.edit", domain: "clinical", labelKey: "access.permission.clinical_edit", sensitivity: "critical", delegatable: true },

  { key: "appointments.manage", domain: "agenda", labelKey: "access.permission.appointments_manage", sensitivity: "normal", delegatable: true },

  { key: "invoices.view", domain: "finance", labelKey: "access.permission.invoices_view", sensitivity: "normal", delegatable: true },
  { key: "invoices.create", domain: "finance", labelKey: "access.permission.invoices_create", sensitivity: "sensitive", delegatable: true },
  { key: "payments.record", domain: "finance", labelKey: "access.permission.payments_record", sensitivity: "sensitive", delegatable: true },
  { key: "expenses.manage", domain: "finance", labelKey: "access.permission.expenses_manage", sensitivity: "sensitive", delegatable: true },

  { key: "caisse.manage", domain: "caisse", labelKey: "access.permission.caisse_manage", sensitivity: "critical", delegatable: false },

  { key: "hr.manage", domain: "equipe", labelKey: "access.permission.hr_manage", sensitivity: "sensitive", delegatable: true },

  { key: "payroll.view", domain: "payroll", labelKey: "access.permission.payroll_view", sensitivity: "critical", delegatable: true },

  { key: "commissions.manage", domain: "commissions", labelKey: "access.permission.commissions_manage", sensitivity: "sensitive", delegatable: true },

  { key: "inventory.manage", domain: "inventory", labelKey: "access.permission.inventory_manage", sensitivity: "normal", delegatable: true },

  { key: "communication.view", domain: "communication", labelKey: "access.permission.communication_view", sensitivity: "normal", delegatable: true },
  { key: "communication.manage", domain: "communication", labelKey: "access.permission.communication_manage", sensitivity: "normal", delegatable: true },

  { key: "reports.view", domain: "reports", labelKey: "access.permission.reports_view", sensitivity: "normal", delegatable: true },

  { key: "settings.manage", domain: "settings", labelKey: "access.permission.settings_manage", sensitivity: "sensitive", delegatable: true },

  { key: "subscription.view", domain: "subscription", labelKey: "access.permission.subscription_view", sensitivity: "normal", delegatable: true },
  { key: "subscription.manage", domain: "subscription", labelKey: "access.permission.subscription_manage", sensitivity: "critical", delegatable: false },

  { key: "access.roles.manage", domain: "access", labelKey: "access.permission.access_roles_manage", sensitivity: "critical", delegatable: false },
  { key: "access.permissions.manage", domain: "access", labelKey: "access.permission.access_permissions_manage", sensitivity: "critical", delegatable: false },
  { key: "access.delegations.manage", domain: "access", labelKey: "access.permission.access_delegations_manage", sensitivity: "critical", delegatable: false },
];

/** Task §8's own domain list, in that order — matrix/catalog grouping never falls back to route-name order. */
export const PERMISSION_DOMAIN_ORDER: PermissionDomain[] = [
  "patients",
  "clinical",
  "agenda",
  "finance",
  "caisse",
  "equipe",
  "payroll",
  "commissions",
  "inventory",
  "communication",
  "reports",
  "settings",
  "subscription",
  "access",
];

export function getPermissionDefinition(key: string): PermissionDefinition | undefined {
  return PERMISSION_CATALOG.find((permission) => permission.key === key);
}

export function getPermissionsByDomain(domain: PermissionDomain): PermissionDefinition[] {
  return PERMISSION_CATALOG.filter((permission) => permission.domain === domain);
}
