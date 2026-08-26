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
