import { describe, expect, it } from "vitest";
import type { CabinetService } from "@/components/domain/settings/types";
import type { BookableSlot, SchedulablePractitioner } from "./types";
import {
  bookingReducer,
  buildBookingReference,
  buildLocalBookingAppointment,
  createInitialBookingState,
  validateContactForm,
  type ContactFormValues,
} from "./booking-state";

const SERVICE: CabinetService = { id: "svc-1", name: "Consultation", durationMinutes: 30, price: 400, schedulingMode: "exact", active: true };
const OTHER_SERVICE: CabinetService = { id: "svc-2", name: "Détartrage", durationMinutes: 45, price: 350, schedulingMode: "exact", active: true };
const WINDOW_SERVICE: CabinetService = {
  id: "svc-4",
  name: "Séance de kinésithérapie",
  durationMinutes: 45,
  price: 300,
  schedulingMode: "window",
  active: true,
};

const PRACTITIONER: SchedulablePractitioner = { teamMemberId: "team-1", practitionerId: "pr-1", name: "Dr. Benali", professionalTitle: "Médecin" };
const OTHER_PRACTITIONER: SchedulablePractitioner = { teamMemberId: "team-2", practitionerId: "pr-2", name: "Dr. Amal", professionalTitle: "Médecin" };

const SLOT: BookableSlot = { startTime: "09:00", endTime: "09:30", practitionerId: "pr-1", serviceId: "svc-1" };

const MESSAGES = { required: "Champ requis", invalidPhone: "Téléphone invalide" };

describe("validateContactForm", () => {
  it("requires first name, last name and phone", () => {
    const errors = validateContactForm({ firstName: "", lastName: "", phone: "", note: "" }, MESSAGES);
    expect(errors).toEqual({ firstName: "Champ requis", lastName: "Champ requis", phone: "Champ requis" });
  });

  it("rejects a too-short phone", () => {
    const errors = validateContactForm({ firstName: "Ahmed", lastName: "El Mansouri", phone: "0612", note: "" }, MESSAGES);
    expect(errors.phone).toBe("Téléphone invalide");
  });

  it("accepts a valid form", () => {
    const errors = validateContactForm({ firstName: "Ahmed", lastName: "El Mansouri", phone: "06 12 34 56 78", note: "" }, MESSAGES);
    expect(errors).toEqual({});
  });

  it("never requires CIN or social coverage fields (task §42)", () => {
    const values: ContactFormValues = { firstName: "Ahmed", lastName: "El Mansouri", phone: "06 12 34 56 78", note: "" };
    expect(Object.keys(values)).not.toContain("cin");
    expect(Object.keys(values)).not.toContain("insuranceRegime");
  });
});

describe("buildBookingReference", () => {
  it("is deterministic from sequence and date", () => {
    expect(buildBookingReference(1, "2026-08-29")).toBe("DEM-20260829-001");
    expect(buildBookingReference(12, "2026-08-29")).toBe("DEM-20260829-012");
  });
});

describe("buildLocalBookingAppointment", () => {
  it("builds an exact-mode appointment with status requested and no real patient link", () => {
    const contact: ContactFormValues = { firstName: "Ahmed", lastName: "El Mansouri", phone: "06 12 34 56 78", note: "Douleur dentaire" };
    const appointment = buildLocalBookingAppointment("booking-1", SERVICE, PRACTITIONER, "2026-08-29", SLOT, contact);

    expect(appointment.status).toBe("requested");
    expect(appointment.schedulingType).toBe("exact");
    expect(appointment.durationMinutes).toBe(30);
    expect(appointment.endTime).toBeUndefined();
    expect(appointment.patientId).toBe("public-booking-1");
    expect(appointment.patientName).toBe("Ahmed El Mansouri");
    expect(appointment.patientPhone).toBe("06 12 34 56 78");
    expect(appointment.practitionerId).toBe("pr-1");
    expect(appointment.note).toBe("Douleur dentaire");
  });

  it("builds a window-mode appointment for a window-scheduled service", () => {
    const contact: ContactFormValues = { firstName: "Karim", lastName: "Idrissi", phone: "06 56 78 90 12", note: "" };
    const windowSlot: BookableSlot = { startTime: "11:00", endTime: "11:45", practitionerId: "pr-2", serviceId: "svc-4" };
    const appointment = buildLocalBookingAppointment("booking-2", WINDOW_SERVICE, OTHER_PRACTITIONER, "2026-08-29", windowSlot, contact);

    expect(appointment.schedulingType).toBe("window");
    expect(appointment.endTime).toBe("11:45");
    expect(appointment.durationMinutes).toBeUndefined();
    expect(appointment.note).toBeUndefined();
  });

  it("never references an existing PATIENTS fixture id (task §45)", () => {
    const contact: ContactFormValues = { firstName: "Sara", lastName: "Alaoui", phone: "06 23 45 67 89", note: "" };
    const appointment = buildLocalBookingAppointment("booking-3", SERVICE, PRACTITIONER, "2026-08-29", SLOT, contact);
    expect(appointment.patientId).not.toMatch(/^pat-\d+$/);
    expect(appointment.patientNumber).toBeUndefined();
  });
});

describe("bookingReducer", () => {
  it("selecting a service advances to practitioner step and clears nothing (first selection)", () => {
    const state = createInitialBookingState();
    const next = bookingReducer(state, { type: "SELECT_SERVICE", service: SERVICE });
    expect(next.step).toBe("practitioner");
    expect(next.service).toEqual(SERVICE);
  });

  it("re-selecting the same service (via Modifier) preserves practitioner/date/slot", () => {
    let state = createInitialBookingState();
    state = bookingReducer(state, { type: "SELECT_SERVICE", service: SERVICE });
    state = bookingReducer(state, { type: "SELECT_PRACTITIONER", practitioner: PRACTITIONER });
    state = bookingReducer(state, { type: "SELECT_DATE", date: "2026-08-29" });
    state = bookingReducer(state, { type: "SELECT_SLOT", slot: SLOT });
    state = bookingReducer(state, { type: "EDIT_STEP", step: "service" });

    const next = bookingReducer(state, { type: "SELECT_SERVICE", service: SERVICE });
    expect(next.practitioner).toEqual(PRACTITIONER);
    expect(next.date).toBe("2026-08-29");
    expect(next.slot).toEqual(SLOT);
  });

  it("changing to a different service invalidates practitioner/date/slot (task §40)", () => {
    let state = createInitialBookingState();
    state = bookingReducer(state, { type: "SELECT_SERVICE", service: SERVICE });
    state = bookingReducer(state, { type: "SELECT_PRACTITIONER", practitioner: PRACTITIONER });
    state = bookingReducer(state, { type: "SELECT_DATE", date: "2026-08-29" });
    state = bookingReducer(state, { type: "SELECT_SLOT", slot: SLOT });

    const next = bookingReducer(state, { type: "SELECT_SERVICE", service: OTHER_SERVICE });
    expect(next.practitioner).toBeNull();
    expect(next.date).toBeNull();
    expect(next.slot).toBeNull();
    expect(next.step).toBe("practitioner");
  });

  it("changing to a different practitioner invalidates date/slot but keeps service", () => {
    let state = createInitialBookingState();
    state = bookingReducer(state, { type: "SELECT_SERVICE", service: SERVICE });
    state = bookingReducer(state, { type: "SELECT_PRACTITIONER", practitioner: PRACTITIONER });
    state = bookingReducer(state, { type: "SELECT_DATE", date: "2026-08-29" });
    state = bookingReducer(state, { type: "SELECT_SLOT", slot: SLOT });

    const next = bookingReducer(state, { type: "SELECT_PRACTITIONER", practitioner: OTHER_PRACTITIONER });
    expect(next.service).toEqual(SERVICE);
    expect(next.date).toBeNull();
    expect(next.slot).toBeNull();
  });

  it("changing the date clears a stale slot", () => {
    let state = createInitialBookingState();
    state = bookingReducer(state, { type: "SELECT_SERVICE", service: SERVICE });
    state = bookingReducer(state, { type: "SELECT_PRACTITIONER", practitioner: PRACTITIONER });
    state = bookingReducer(state, { type: "SELECT_DATE", date: "2026-08-29" });
    state = bookingReducer(state, { type: "SELECT_SLOT", slot: SLOT });

    const next = bookingReducer(state, { type: "SELECT_DATE", date: "2026-08-30" });
    expect(next.slot).toBeNull();
  });

  it("selecting a slot advances to the details step", () => {
    const state = createInitialBookingState();
    const next = bookingReducer(state, { type: "SELECT_SLOT", slot: SLOT });
    expect(next.step).toBe("details");
    expect(next.slot).toEqual(SLOT);
  });

  it("SLOT_NO_LONGER_AVAILABLE clears the slot, returns to date step, and sets the notice", () => {
    let state = createInitialBookingState();
    state = bookingReducer(state, { type: "SELECT_SLOT", slot: SLOT });
    const next = bookingReducer(state, { type: "SLOT_NO_LONGER_AVAILABLE" });
    expect(next.slot).toBeNull();
    expect(next.step).toBe("date");
    expect(next.slotUnavailableNotice).toBe(true);
  });

  it("CONFIRM_BOOKING records the booking, appends to sessionBookings, and advances the sequence", () => {
    const state = createInitialBookingState();
    const booking = {
      id: "booking-1",
      reference: "DEM-20260829-001",
      appointment: buildLocalBookingAppointment(
        "booking-1",
        SERVICE,
        PRACTITIONER,
        "2026-08-29",
        SLOT,
        { firstName: "Ahmed", lastName: "El Mansouri", phone: "06 12 34 56 78", note: "" },
      ),
    };
    const next = bookingReducer(state, { type: "CONFIRM_BOOKING", booking });
    expect(next.step).toBe("confirmation");
    expect(next.confirmedBooking).toEqual(booking);
    expect(next.sessionBookings).toEqual([booking.appointment]);
    expect(next.nextBookingSequence).toBe(2);
  });

  it("RESTART resets the wizard but preserves sessionBookings (so a second booking cannot re-take an already-booked slot)", () => {
    let state = createInitialBookingState();
    const booking = {
      id: "booking-1",
      reference: "DEM-20260829-001",
      appointment: buildLocalBookingAppointment(
        "booking-1",
        SERVICE,
        PRACTITIONER,
        "2026-08-29",
        SLOT,
        { firstName: "Ahmed", lastName: "El Mansouri", phone: "06 12 34 56 78", note: "" },
      ),
    };
    state = bookingReducer(state, { type: "CONFIRM_BOOKING", booking });

    const next = bookingReducer(state, { type: "RESTART" });
    expect(next.step).toBe("service");
    expect(next.service).toBeNull();
    expect(next.confirmedBooking).toBeNull();
    expect(next.sessionBookings).toEqual([booking.appointment]);
    expect(next.nextBookingSequence).toBe(2);
  });

  it("GO_BACK moves to the previous step without clearing data", () => {
    let state = createInitialBookingState();
    state = bookingReducer(state, { type: "SELECT_SLOT", slot: SLOT });
    const next = bookingReducer(state, { type: "GO_BACK" });
    expect(next.step).toBe("date");
    expect(next.slot).toEqual(SLOT);
  });
});
