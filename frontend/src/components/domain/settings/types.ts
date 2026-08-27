import type { AppointmentSchedulingType } from "@/components/domain/appointments/types";
import type { Weekday } from "@/components/domain/team/types";

/**
 * Cabinet Settings prototype model (UI-010ABC Gate 2, Spec #2 §44, Spec #4
 * §5.1 `tenants`). Deliberately a narrowed, frontend-only subset of the
 * approved `tenants` schema: no `slug` (public booking's own `/book/{slug}`
 * routing is a separate, unbuilt backend concern), no `logo_file_id` (no
 * real file storage exists in this prototype — a real upload flow would
 * require object-storage infrastructure this task does not build, so the
 * settings form shows a read-only placeholder instead, never a fake
 * upload). `currencyCode`/`timezone` are fixed, non-editable fields — Spec
 * #2 §44 itself says "Currency fixed to MAD initially", and no timezone
 * picker UX is defined anywhere in the approved specifications.
 */
export type CabinetSpecialty =
  | "general_medicine"
  | "dentistry"
  | "physiotherapy"
  | "psychology"
  | "nutrition"
  | "dermatology"
  | "multi_practitioner";

export type PreferredLanguage = "fr" | "ar";

export interface CabinetProfile {
  name: string;
  specialty: CabinetSpecialty;
  address?: string;
  city?: string;
  phone: string;
  email?: string;
  preferredLanguage: PreferredLanguage;
  /** Fixed for V1 (Spec #2 §44) — never part of the editable form. */
  currencyCode: "MAD";
  /** Fixed, display-only — no timezone picker is defined anywhere in the approved specifications (Spec #2 §46's own "Morocco-appropriate timezone" wording, no selector UX). */
  timezone: string;
}

/** Bounded edit form (UI-010ABC §12) — `currencyCode`/`timezone` are immutable, never part of this shape (mirrors `EmploymentContractFormValues`'s own "immutable fields excluded" convention). */
export interface CabinetProfileFormValues {
  name: string;
  specialty: CabinetSpecialty;
  address: string;
  city: string;
  phone: string;
  email: string;
  preferredLanguage: PreferredLanguage;
}

/**
 * Services & Pricing (UI-010ABC Gate 3, Spec #2 §45, Spec #4 §13.1
 * `tenant_services`). `schedulingMode` reuses `AppointmentSchedulingType`
 * verbatim (CLAUDE.md §15's own exact/window vocabulary) rather than a
 * second near-identical enum — this field is precisely "how this service's
 * own appointments are scheduled." `price`/`durationMinutes` seed from
 * Agenda's own `SERVICES` catalog (the one pre-existing scattered service
 * list in the repo) rather than an unrelated new list (task §5: "provide
 * them a coherent configuration home").
 */
export interface CabinetService {
  id: string;
  name: string;
  durationMinutes: number;
  /** MAD, whole units — mirrors `MoneyAmount`'s own convention (never imported directly here to avoid a domain→domain cross-import; both are plain `number`). */
  price: number;
  schedulingMode: AppointmentSchedulingType;
  active: boolean;
}

/** Bounded add/edit form (UI-010ABC §15) — numeric fields are strings while edited, mirroring every other `*FormValues` convention in this codebase (e.g. `PayrollAdjustment` amounts, `WorkDayFormValues` times). */
export interface CabinetServiceFormValues {
  name: string;
  durationMinutes: string;
  price: string;
  schedulingMode: AppointmentSchedulingType;
  active: boolean;
}

/**
 * Cabinet working hours (UI-010ABC Gate 3, Spec #2 §46). Cabinet-level
 * only, not per-practitioner: Spec #4 §12 only ever defines
 * `practitioner_working_hours` (no `practice_working_hours` table exists),
 * and Spec #2 §46's own prose distinguishes "Practice hours" from
 * "Practitioner hours" without resolving how a multi-practitioner cabinet
 * would reconcile the two — a genuine, unresolved specification gap. This
 * task implements the one unambiguous case both the onboarding wireframe
 * (Spec #9 Screen 05) and CLAUDE.md's own "solo-first, cabinet-capable"
 * framing actually show: one weekly schedule for the cabinet as a whole.
 * Per-practitioner hours remain Équipe's own `WorkInterval` concept
 * (`components/domain/team/types.ts`), untouched by this task. `weekday`
 * reuses Team's own `Weekday` type verbatim — its own doc comment already
 * anticipates this exact "abstract calendar-independent weekly pattern"
 * reuse.
 */
export interface CabinetWorkingHoursDay {
  weekday: Weekday;
  isOpen: boolean;
  /** "HH:mm" — set only when `isOpen`. */
  startTime?: string;
  endTime?: string;
}

/** One editable weekday row (UI-010ABC §16) — bounded to a single interval per day (no lunch-break split, unlike Team's own per-employee `WorkDayFormValues`): this is one cabinet-wide operating window, not an individual's shift. */
export interface CabinetWorkingHoursFormDay {
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

/**
 * Read-only numbering/document configuration summary (UI-010ABC §18, Spec
 * #2 §47, Spec #4 §27.2 `numbering_sequences`). Deliberately READ-ONLY:
 * concurrency-safe sequence allocation ("lock sequence row during
 * allocation", §59) is a real backend/database concern this frontend
 * prototype does not implement — showing an editable form here would
 * misrepresent a guarantee this prototype cannot provide. `nextNumber` is
 * always computed live from the same fixtures each number already comes
 * from (`generatePatientNumber`/`generateEmployeeNumber` reused verbatim
 * for PAT/EMP; the same regex-extract-max+1 pattern applied locally for
 * FAC/REC, which have no existing generator to reuse), never hardcoded.
 */
export interface NumberingSequenceRow {
  sequenceType: "PAT" | "EMP" | "FAC" | "REC";
  labelKey: string;
  prefix: string;
  yearReset: boolean;
  nextNumber: string;
}
