import type { CabinetService } from "@/components/domain/settings/types";
import type { AgendaAppointment } from "@/features/agenda/types";
import { isValidMoroccanPhone } from "@/features/patients/patient-form-validation";
import type { BookableSlot, SchedulablePractitioner } from "./types";

export type BookingStep = "service" | "practitioner" | "date" | "details" | "review" | "confirmation";

const STEP_ORDER: BookingStep[] = ["service", "practitioner", "date", "details", "review", "confirmation"];

export function previousStep(step: BookingStep): BookingStep {
  const index = STEP_ORDER.indexOf(step);
  return STEP_ORDER[Math.max(0, index - 1)];
}

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  note: string;
}

export interface ContactFormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/** Task §41/§42/§43 — deliberately bounded to Screen 51's own exact field list (Spec #9 §54). No CIN, no social coverage, no clinical data. */
export const INITIAL_CONTACT: ContactFormValues = { firstName: "", lastName: "", phone: "", note: "" };

export function validateContactForm(
  contact: ContactFormValues,
  messages: { required: string; invalidPhone: string },
): ContactFormErrors {
  const errors: ContactFormErrors = {};
  if (!contact.firstName.trim()) errors.firstName = messages.required;
  if (!contact.lastName.trim()) errors.lastName = messages.required;
  if (!contact.phone.trim()) {
    errors.phone = messages.required;
  } else if (!isValidMoroccanPhone(contact.phone)) {
    errors.phone = messages.invalidPhone;
  }
  return errors;
}

/** Deterministic, session-local, prototype-only reference (task §50) — never claims to be the backend `numbering_sequences` allocator (`NumberingSequenceRow` covers PAT/EMP/FAC/REC only, never appointments). */
export function buildBookingReference(sequence: number, date: string): string {
  return `DEM-${date.replace(/-/g, "")}-${String(sequence).padStart(3, "0")}`;
}

/**
 * The local, session-only booking record (task §48/§52) — shaped exactly
 * like the canonical `AgendaAppointment` (reused, never a parallel model),
 * but never written into Agenda's own fixtures. `patientId` is a synthetic
 * `public-*` sentinel, deliberately never one of `PATIENTS`' real ids
 * (task §45 — no probabilistic matching, no silent linking to an existing
 * patient). Status is always `"requested"` (task §49, Spec #9 Screen 52 /
 * WF-04 §5: "Request is created as REQUESTED").
 */
export function buildLocalBookingAppointment(
  id: string,
  service: CabinetService,
  practitioner: SchedulablePractitioner,
  date: string,
  slot: BookableSlot,
  contact: ContactFormValues,
): AgendaAppointment {
  return {
    id,
    date,
    schedulingType: service.schedulingMode,
    time: slot.startTime,
    endTime: service.schedulingMode === "window" ? slot.endTime : undefined,
    durationMinutes: service.schedulingMode === "exact" ? service.durationMinutes : undefined,
    patientId: `public-${id}`,
    patientName: `${contact.firstName.trim()} ${contact.lastName.trim()}`.trim(),
    patientPhone: contact.phone.trim(),
    practitionerId: practitioner.practitionerId,
    practitionerName: practitioner.name,
    service: service.name,
    status: "requested",
    note: contact.note.trim() || undefined,
  };
}

export interface LocalBooking {
  id: string;
  reference: string;
  appointment: AgendaAppointment;
}

export interface BookingWizardState {
  step: BookingStep;
  service: CabinetService | null;
  practitioner: SchedulablePractitioner | null;
  date: string | null;
  slot: BookableSlot | null;
  contact: ContactFormValues;
  contactErrors: ContactFormErrors;
  slotUnavailableNotice: boolean;
  /** Every booking confirmed so far this session — merged into the availability engine's appointment source so a just-booked slot can never be double-booked locally (task §51), without ever mutating Agenda's own fixtures. */
  sessionBookings: AgendaAppointment[];
  confirmedBooking: LocalBooking | null;
  nextBookingSequence: number;
}

export function createInitialBookingState(): BookingWizardState {
  return {
    step: "service",
    service: null,
    practitioner: null,
    date: null,
    slot: null,
    contact: INITIAL_CONTACT,
    contactErrors: {},
    slotUnavailableNotice: false,
    sessionBookings: [],
    confirmedBooking: null,
    nextBookingSequence: 1,
  };
}

export type BookingAction =
  | { type: "SELECT_SERVICE"; service: CabinetService }
  | { type: "SELECT_PRACTITIONER"; practitioner: SchedulablePractitioner }
  | { type: "SELECT_DATE"; date: string }
  | { type: "SELECT_SLOT"; slot: BookableSlot }
  | { type: "UPDATE_CONTACT"; field: keyof ContactFormValues; value: string }
  | { type: "GO_TO_REVIEW" }
  | { type: "SUBMIT_INVALID"; errors: ContactFormErrors }
  | { type: "GO_BACK" }
  | { type: "EDIT_STEP"; step: BookingStep }
  | { type: "SLOT_NO_LONGER_AVAILABLE" }
  | { type: "CONFIRM_BOOKING"; booking: LocalBooking }
  | { type: "RESTART" };

/**
 * Task §40 — changing an earlier selection invalidates every step that
 * depends on it, but only when the selection actually *changes*: re-
 * confirming the same service/practitioner (e.g. via Review's own
 * "Modifier" jumping back without clearing data) must not silently wipe an
 * already-made date/slot choice.
 */
export function bookingReducer(state: BookingWizardState, action: BookingAction): BookingWizardState {
  switch (action.type) {
    case "SELECT_SERVICE": {
      const changed = state.service?.id !== action.service.id;
      return {
        ...state,
        service: action.service,
        practitioner: changed ? null : state.practitioner,
        date: changed ? null : state.date,
        slot: changed ? null : state.slot,
        step: "practitioner",
      };
    }

    case "SELECT_PRACTITIONER": {
      const changed = state.practitioner?.practitionerId !== action.practitioner.practitionerId;
      return {
        ...state,
        practitioner: action.practitioner,
        date: changed ? null : state.date,
        slot: changed ? null : state.slot,
        step: "date",
      };
    }

    case "SELECT_DATE": {
      const changed = state.date !== action.date;
      return { ...state, date: action.date, slot: changed ? null : state.slot, slotUnavailableNotice: false };
    }

    case "SELECT_SLOT":
      return { ...state, slot: action.slot, step: "details", slotUnavailableNotice: false };

    case "UPDATE_CONTACT":
      return {
        ...state,
        contact: { ...state.contact, [action.field]: action.value },
        contactErrors: { ...state.contactErrors, [action.field]: undefined },
      };

    case "GO_TO_REVIEW":
      return { ...state, step: "review", contactErrors: {} };

    case "SUBMIT_INVALID":
      return { ...state, contactErrors: action.errors };

    case "GO_BACK":
      return { ...state, step: previousStep(state.step) };

    case "EDIT_STEP":
      return { ...state, step: action.step };

    case "SLOT_NO_LONGER_AVAILABLE":
      return { ...state, slot: null, step: "date", slotUnavailableNotice: true };

    case "CONFIRM_BOOKING":
      return {
        ...state,
        confirmedBooking: action.booking,
        sessionBookings: [...state.sessionBookings, action.booking.appointment],
        nextBookingSequence: state.nextBookingSequence + 1,
        step: "confirmation",
      };

    case "RESTART":
      return {
        ...createInitialBookingState(),
        sessionBookings: state.sessionBookings,
        nextBookingSequence: state.nextBookingSequence,
      };

    default:
      return state;
  }
}
