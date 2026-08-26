import type { MoneyAmount } from "@/components/domain/finance/types";

/**
 * A TeamMember is the cabinet-level HR representation of a person working
 * in the cabinet (UI-007A §7) — distinct from a future authentication User
 * (an account able to log into the SaaS). This type intentionally carries
 * no auth fields (password, MFA, sessions, permissions): a TeamMember can
 * exist without ever having platform access, and the reverse relationship
 * (User -> TeamMember) is a later, unbuilt concern.
 *
 * A `practitionerId` links a TeamMember to the lightweight
 * `AgendaPractitioner` identities already used by Agenda/Patients/Caisse
 * (`features/agenda/mock-data.ts`'s `PRACTITIONERS`) where the same person
 * is both a cabinet employee and a schedulable practitioner. It is `undefined`
 * for team members who are not practitioners, or for practitioners not yet
 * represented in that lightweight fixture. UI-007A does not refactor those
 * existing selectors to consume `TeamMember` (task §8) — the two
 * representations intentionally coexist for now.
 */
export type TeamRole = "practitioner" | "receptionist" | "assistant" | "manager" | "other";

/**
 * Kept minimal (UI-007A §13): leave/on_leave/suspended belong to the future
 * leave-management task (UI-007D) that owns that state, not this directory.
 */
export type TeamMemberStatus = "active" | "inactive";

export interface TeamMember {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  role: TeamRole;
  /** Free-text professional title (e.g. "Médecin", "Kinésithérapeute") — not a role enum (§11). */
  professionalTitle?: string;
  phone?: string;
  email?: string;
  /** ISO date the member started at the cabinet. */
  startDate?: string;
  status: TeamMemberStatus;
  /** Links to `AgendaPractitioner.id` when this member is also a schedulable practitioner. */
  practitionerId?: string;
}

/** Create/edit form model (UI-007A §6) — deliberately not the full future employment/contract entity. */
export interface TeamMemberFormValues {
  firstName: string;
  lastName: string;
  role: TeamRole;
  professionalTitle: string;
  phone: string;
  email: string;
  startDate: string;
  status: TeamMemberStatus;
}

export type TeamRoleFilter = "all" | TeamRole;
export type TeamStatusFilter = "all" | TeamMemberStatus;

/**
 * Bounded vocabulary (UI-007B §12) — the domain-data spec only defines a
 * free-text `employees.employment_type` column, no enum, so this task's
 * own explicit suggested list is authoritative here (CLAUDE.md §1).
 * "permanent"/"fixed_term" are labeled "CDI"/"CDD" in French — the
 * standard Francophone terms for those two contract shapes, not an
 * invented Moroccan-specific legal category.
 */
export type ContractType = "permanent" | "fixed_term" | "part_time" | "internship" | "other";

/** Kept to two values (UI-007B §14) — no `future`/`suspended`, nothing in scope requires them. */
export type ContractStatus = "active" | "ended";

/**
 * An EmploymentContract is the employment agreement, deliberately separate
 * from `TeamMember` (§10) — a TeamMember is cabinet identity/basic profile,
 * this is the contractual relationship. No remuneration field anywhere
 * (§20) — salary/rate/bonus/deduction belong to UI-007E's payroll screen,
 * not this one. `jobTitle` may initially mirror the linked TeamMember's
 * `professionalTitle` in fixtures, but remains its own contract-specific
 * value (§18) — the two are never structurally the same field.
 */
export interface EmploymentContract {
  id: string;
  teamMemberId: string;
  /** Human-facing reference, e.g. "CTR-2025-0003" (§16) — read-only once created, never editable. */
  contractNumber?: string;
  contractType: ContractType;
  status: ContractStatus;
  /** ISO date. */
  startDate: string;
  /** ISO date, or `undefined` for an open-ended contract (§17). */
  endDate?: string;
  jobTitle: string;
  /** Contractual hours per week — informational only, never used to derive pay (§19/§20). */
  weeklyHours?: number;
  notes?: string;
}

/** Bounded edit-only form model (UI-007B §8) — `contractNumber`/`teamMemberId` are immutable, never part of this shape. */
export interface EmploymentContractFormValues {
  contractType: ContractType;
  status: ContractStatus;
  jobTitle: string;
  startDate: string;
  endDate: string;
  weeklyHours: string;
  notes: string;
}

/**
 * Abstract calendar-independent weekday — deliberately not coupled to
 * Agenda's date-based scheduling (`features/agenda/format.ts`'s
 * `formatWeekdayShort` operates on a concrete ISO date, not this kind of
 * recurring weekly pattern; reusing it would require inventing a fake
 * "reference week" purely to borrow day-name labels, so this task defines
 * its own small `team.weekday.*` translation set instead — task §4's own
 * "do not couple to appointment scheduling" instruction).
 */
export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

/**
 * One expected working interval on one weekday (Spec #4 §20.1
 * `employee_work_schedules` — one row per interval; several rows sharing
 * the same `weekday` model a split shift, satisfying §7's "multiple work
 * intervals per day" requirement without a separate list field). `active`
 * mirrors the spec's own column for shape-fidelity, but no UI in this
 * task ever toggles it — an interval simply not existing already means
 * "not working that day" (same "kept for shape-fidelity, never reached by
 * the UI" precedent as `PrescriptionStatus`'s `"cancelled"`, UI-005D).
 */
export interface WorkInterval {
  id: string;
  teamMemberId: string;
  weekday: Weekday;
  /** "HH:mm", 24h. */
  startTime: string;
  endTime: string;
  active: boolean;
}

/** One editable weekday row (UI-007B §9) — bounded to at most 2 intervals (covers a lunch-break split shift). */
export interface WorkDayFormValues {
  worked: boolean;
  interval1Start: string;
  interval1End: string;
  hasSecondInterval: boolean;
  interval2Start: string;
  interval2End: string;
}

export type WorkWeekFormValues = Record<Weekday, WorkDayFormValues>;

/**
 * GATE 1 — Attendance (UI-007CDEF §11-25). PRESENCE (what actually
 * happened), never PLANNING (`WorkInterval`, above) — this record's own
 * `checkIn`/`checkOut` are compared against that member's own
 * `WorkInterval`s for the matching weekday by `features/team/attendance.ts`'s
 * pure functions, never re-declared here (no duplicated "expected time"
 * data). Deliberately a *frontend-only, non-persisted* prototype — see
 * `docs/implementation/DECISIONS.md` ADR-005: the approved specifications
 * (Spec #4 §20, Spec #3 §39/WF-36) both explicitly say clock-in/out is
 * not a required V1 *backend* entity/workflow; this type creates no
 * backend counterpart, only local React state.
 *
 * Only raw facts are stored (`checkIn?`/`checkOut?`); status, worked/late/
 * early-departure/overtime minutes are always *derived*, never duplicated
 * fields — the same "derive from source, never store a parallel figure"
 * discipline already used throughout this codebase (e.g. Caisse's
 * theoretical balance, UI-006E). Confirmed by this task's own §14: "Create
 * pure helpers... Do not calculate payroll here."
 */
export interface AttendanceRecord {
  id: string;
  teamMemberId: string;
  /** ISO date. */
  businessDate: string;
  /** "HH:mm" — deterministic prototype value, set only once "checked in" (never `Date.now()`, §16). */
  checkIn?: string;
  checkOut?: string;
  note?: string;
}

/**
 * Bounded (UI-007CDEF §13). Approved leave is deliberately NOT a member of
 * this enum — it is represented as separate contextual "explains the
 * absence" presentation instead (§33), not a status value here, so this
 * enum never needs to know Gate 2's own `LeaveRequest` shape.
 */
export type AttendanceStatus = "not_checked_in" | "present" | "late" | "completed" | "absent";

/** GATE 2 — Leave (UI-007CDEF §26-36). Bounded per the task's own explicit list (§27) — no detailed Moroccan statutory leave categories invented. */
export type LeaveType = "annual" | "sick" | "unpaid" | "other";

/** Mirrors Spec #4 §20.2's `leave_requests.status` ENUM, narrowed to the three states this prototype's UI actually reaches (no `draft`/`cancelled` workflow here). */
export type LeaveRequestStatus = "pending" | "approved" | "rejected";

/**
 * Mirrors Spec #4 §20.2's `leave_requests` fields (narrowed — no
 * `partial_day_data`/`attachment_file_id`, out of this prototype's scope).
 * `duration` is a whole number of days, computed once at submission time
 * by a pure prototype rule (`features/team/leave.ts`'s `computeLeaveDurationDays`
 * — inclusive calendar-day count, no weekend/holiday exclusion invented,
 * §31) and stored so an already-decided request's own historical duration
 * never silently changes.
 */
export interface LeaveRequest {
  id: string;
  teamMemberId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  duration: number;
  reason?: string;
  status: LeaveRequestStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

/** Bounded create-request form model (UI-007CDEF §31). */
export interface LeaveRequestFormValues {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

/**
 * Synthetic fixture balance (UI-007CDEF §29) — no statutory accrual
 * formula (Moroccan labor law leave accrual is not defined by the
 * approved specifications, so none is invented here). `available`/`used`
 * are seed fixture values; `pending` is always *derived* from the
 * member's own current `LeaveRequest[]` (never a duplicated stored
 * figure) by `features/team/leave.ts`'s `computePendingDays`.
 */
export interface LeaveBalance {
  teamMemberId: string;
  leaveType: LeaveType;
  available: number;
  used: number;
}

/**
 * GATE 3 — Payroll (UI-007CDEF §37-51). A *cabinet operational* payroll
 * prototype, never a statutory Moroccan payroll/tax/CNSS/AMO/IR engine
 * (§37/§77 — Spec #3 §42/WF-39 itself says the same: "Statutory Moroccan
 * payroll/tax/social compliance is not claimed without separate
 * specification"). Bounded to two values per the task's own §38 list
 * (narrower than Spec #4 §21.1's three-value `draft/reviewed/finalized`
 * backend ENUM — this task's own explicit list takes priority, CLAUDE.md
 * §1, the same precedent UI-006E already established for
 * `CashSessionStatus`).
 */
export type PayrollPeriodStatus = "draft" | "finalized";

export interface PayrollPeriod {
  id: string;
  /** e.g. "Août 2026" — display label, not re-derived from `startDate` every render (mirrors `CashSession`'s own precomputed display fields). */
  label: string;
  startDate: string;
  endDate: string;
  status: PayrollPeriodStatus;
}

/** Mirrors Spec #4 §21.2's `payment_status` ENUM(unpaid, paid) exactly — a distinct concept from `PayrollPeriod.status` (editability vs. disbursement, §50). */
export type PayrollEntryStatus = "unpaid" | "paid";

/** One bonus or deduction line item (UI-007CDEF §44-45) — which array it lives in (`PayrollEntry.bonuses`/`.deductions`) already encodes the sign; no redundant `type` field. */
export interface PayrollAdjustment {
  id: string;
  label: string;
  amount: MoneyAmount;
}

/**
 * One employee's payroll line for one period (Spec #4 §21.2, narrowed —
 * `baseAmount` is a synthetic *payroll-specific* configuration value
 * (§40 — never retroactively added to `EmploymentContract`, which UI-007B
 * deliberately kept salary-free). `overtimeMinutes` is duration only,
 * reconciled against Gate 1's own attendance overtime (§42) — no monetary
 * overtime rate/multiplier is invented anywhere (§43, §21): overtime pay
 * is explicitly represented as future/backend configuration, never
 * silently folded into `baseAmount`. `commissionAmount` is populated only
 * for a practitioner with an active `CommissionRule` (Gate 4), and is
 * always equal to that rule's own computed amount for the same period —
 * never an independently hardcoded figure (§61).
 */
export interface PayrollEntry {
  id: string;
  payrollPeriodId: string;
  teamMemberId: string;
  baseAmount: MoneyAmount;
  overtimeMinutes: number;
  bonuses: PayrollAdjustment[];
  deductions: PayrollAdjustment[];
  commissionAmount?: MoneyAmount;
  status: PayrollEntryStatus;
}

/**
 * GATE 4 — Practitioner commissions (UI-007CDEF §52-63). `teamMemberId`
 * must resolve to a `TeamMember` with `role === "practitioner"` AND a
 * defined `practitionerId` (§56) — a role of "practitioner" alone is not
 * sufficient (see `features/team/mock-data.ts`'s Othmane Zouiten, who is
 * a practitioner with no `practitionerId` link, deliberately proving this
 * distinction, UI-007A §16). `basis` is fixed to `"collected_payments"` —
 * the only basis the approved specifications actually demonstrate with a
 * worked example (Spec #9 Screen 38: "Base de calcul — Montants
 * encaissés"; Spec #3 WF-40's own example: "Collected amount: 4,000 MAD ×
 * 30% = 1,200 MAD"); the other bases CLAUDE.md §28 lists (invoiced
 * amount, fixed per service, ...) are not implemented here since no
 * approved wireframe/workflow demonstrates their exact rule (§54 — "Do
 * NOT invent the business basis").
 */
export type CommissionBasis = "collected_payments";

export type CommissionRuleStatus = "active" | "inactive";

export interface CommissionRule {
  id: string;
  teamMemberId: string;
  basis: CommissionBasis;
  /** Percentage, e.g. `30` meaning 30% — matches Spec #3 WF-40's own worked example exactly. */
  ratePercent: number;
  status: CommissionRuleStatus;
}
