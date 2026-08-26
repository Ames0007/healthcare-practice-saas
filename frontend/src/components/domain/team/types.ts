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
