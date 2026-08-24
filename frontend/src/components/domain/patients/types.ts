/**
 * Small Patient 360° overview model (UI-004A §26) — deliberately separate
 * from `features/patients/types.ts`'s `Patient` (the administrative
 * record) so future domain concepts (treatments, installments, activity)
 * don't get folded into the patient type itself. `Patient.nextAppointment`/
 * `outstandingBalance` are reused as-is, not duplicated here (CLAUDE.md
 * §12). Domain-owned, mirroring `components/domain/appointments/types.ts`
 * — features/patients depends on this layer, not the other way around.
 */

export type PatientTabKey = "overview" | "health" | "appointments" | "treatments" | "invoices" | "payments";

export interface PatientActiveTreatment {
  name: string;
  completedSessions: number;
  totalSessions: number;
}

export interface PatientNextInstallment {
  amount: number;
  dueDate: string;
}

export type PatientActivityType = "appointment" | "consultation" | "payment" | "document" | "treatment";

export interface PatientActivityItem {
  id: string;
  date: string;
  type: PatientActivityType;
  /** Dot-path i18n key — never a raw display string (must translate to AR). */
  translationKey: string;
  /** Only for money-bearing items (e.g. payment) — formatted via `formatMad` at render time, not pre-formatted here. */
  amount?: number;
}

export interface PatientOverview {
  patientId: string;
  activeTreatment: PatientActiveTreatment | null;
  nextInstallment: PatientNextInstallment | null;
  /** Concise operational summaries only — no clinical note/diagnosis text (UI-004A §32). */
  recentActivity: PatientActivityItem[];
}
