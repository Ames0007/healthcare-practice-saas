/**
 * Access Governance domain (UI-011X, Spec #4 §4, CLAUDE.md §9). Frontend
 * governance PROTOTYPE only — nothing here is authoritative authorization
 * (task §9-equivalent boundary, mirrored from `domain/subscription/`'s
 * own "frontend UX only" framing). Deliberately distinct from:
 *
 * - `domain/team/` `TeamMember` — a person employed by the cabinet. A
 *   `TeamMember` may exist with no `UserAccount` at all (this module's
 *   own explicit rule) — someone who works at the cabinet but never logs
 *   into the system.
 * - `domain/subscription/` `PlanEntitlement` — capability the *tenant*
 *   purchased, never what a specific *user* may do (CLAUDE.md §10).
 *
 * Naming follows Spec #4 §4.3 `membership_permissions.permission_code`
 * and CLAUDE.md §9's own identical example list verbatim (both sources
 * independently give the same 16-key vocabulary) rather than a deeper,
 * more granular scheme — see `permission-catalog.ts`'s own doc comment
 * and `docs/implementation/DECISIONS.md` ADR-011.
 */

export type PermissionDomain =
  | "patients"
  | "clinical"
  | "agenda"
  | "finance"
  | "caisse"
  | "equipe"
  | "payroll"
  | "commissions"
  | "inventory"
  | "communication"
  | "reports"
  | "settings"
  | "subscription"
  | "access";

/** UI warning framing only (task §7) — never a backend enforcement signal. */
export type PermissionSensitivity = "normal" | "sensitive" | "critical";

export interface PermissionDefinition {
  key: string;
  domain: PermissionDomain;
  labelKey: string;
  descriptionKey?: string;
  sensitivity: PermissionSensitivity;
  /** Whether this permission may ever appear on a `Delegation` — see `permission-catalog.ts` for which keys are excluded and why (privilege-escalation / physical-custody reasoning, ADR-011). */
  delegatable: boolean;
}

/**
 * Spec #2 §29.1's own exact 3-role V1 list — "Do not invent excessive
 * role proliferation" (task §9). `nameKey`/`descriptionKey` (not raw
 * strings) since these 3 system roles are fixed product vocabulary, not
 * user-entered/renameable text — mirrors `PermissionDefinition.labelKey`/
 * `NumberingSequenceRow.labelKey`'s own established convention, resolved
 * via `t()` at render time rather than stored pre-translated.
 */
export interface AccessRole {
  id: string;
  nameKey: string;
  descriptionKey: string;
  permissionKeys: string[];
  /** All 3 V1 roles are product-defined baseline concepts, not ad hoc custom roles — protects them from a delete affordance this prototype never offers anyway (task §11). */
  systemRole: boolean;
  active: boolean;
}

/** Spec #4 §4.1 `users`, narrowed: no `password_hash`, no MFA, no session fields — this module governs access, it does not authenticate anyone. */
export type UserAccountStatus = "invited" | "active" | "disabled" | "locked";

export interface UserAccount {
  id: string;
  displayName: string;
  email: string;
  /** Optional — a `UserAccount` need not correspond to any `TeamMember` in principle, though every fixture here does (task §12). */
  teamMemberId?: string;
  status: UserAccountStatus;
}

/**
 * Spec #4 §4.2 `tenant_memberships`, narrowed to this prototype's single
 * synthetic tenant (task §13: "Do not implement multi-tenant switching").
 * `roleIds` is plural (a membership may hold more than one role) even
 * though every fixture here assigns exactly one — the array shape is
 * real, just not exercised by more than one role in the demo data.
 */
export interface TenantMembership {
  id: string;
  userId: string;
  tenantId: string;
  roleIds: string[];
  /** Permission keys explicitly granted beyond what `roleIds` alone would give (Screen 35's own worked example: a receptionist granted Invoices/Payments/Caisse beyond her role's default). */
  individualGrants: string[];
  /** Permission keys explicitly denied even if a role or grant would otherwise include them — restrictions always win (`effective-access.ts`). */
  individualRestrictions: string[];
  active: boolean;
}

/**
 * Delegation of Authority (UI-011X Gate 3). No approved specification
 * names "delegation" anywhere (grep-confirmed zero matches across all 10
 * specs) — this is a direct application of the task's own explicit Gate
 * 3 instructions (CLAUDE.md §1: explicit task instructions outrank
 * specs), kept deliberately minimal per CLAUDE.md §3 ("do not invent a
 * large new subsystem"). The closest approved-spec precedent is Spec #4
 * §7.3 `patient_access_grants` — a dormant, "future-ready" time-bounded
 * clinical-access-sharing grant with the same `starts_at`/`ends_at`/
 * `status` shape this generalizes to any `delegatable` permission (see
 * `docs/implementation/DECISIONS.md` ADR-011). One delegation always
 * carries exactly one permission key — "temporary transfer of *specific*
 * authority" (task's own objective diagram), never a bundle of several.
 */
export type DelegationStatus = "scheduled" | "active" | "expired" | "revoked";

export interface Delegation {
  id: string;
  delegatorMembershipId: string;
  delegateMembershipId: string;
  permissionKey: string;
  reason?: string;
  startsAt: string;
  endsAt: string;
  /** Set only once revoked — revocation always wins over the date-derived status, even mid-window (`delegation-lifecycle.ts`'s own `resolveDelegationStatus`). */
  revokedAt?: string;
  createdAt: string;
}

/**
 * Bounded, read-only audit prototype (task §23, WF-35/WF-64/WF-65/WF-66's
 * own repeated "Audit event" requirement) — a static fixture list, not a
 * real append-only log (CLAUDE.md §39's real guarantee is a backend
 * concern this prototype does not implement).
 */
export type AccessAuditEventType =
  | "role_assigned"
  | "role_removed"
  | "permission_granted"
  | "permission_restricted"
  | "delegation_created"
  | "delegation_revoked"
  | "user_deactivated";

export interface AccessAuditEvent {
  id: string;
  occurredAt: string;
  type: AccessAuditEventType;
  actorMembershipId: string;
  targetMembershipId: string;
  detail?: string;
}

/**
 * Effective-access read model (UI-011X Gate 2 prerequisite / Gate 4's
 * own "explanation UI", task §21-22) — a projection over
 * `TenantMembership`/`AccessRole`/`Delegation`, never a fifth persisted
 * entity (mirrors `ActivityReportKpis`'s own "read-model row" precedent,
 * `features/rapports/`). `sources` names every layer that independently
 * grants the permission (a membership can hold the same key via its role
 * AND an individual grant at once); `restricted` always wins over every
 * source — `granted` is `false` whenever `restricted` is `true`, even
 * with one or more sources present.
 */
export type PermissionSource = "role" | "grant" | "delegation";

export interface EffectivePermissionEntry {
  permissionKey: string;
  granted: boolean;
  sources: PermissionSource[];
  restricted: boolean;
}
