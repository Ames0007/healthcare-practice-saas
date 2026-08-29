"use client";

import { useMemo, useReducer } from "react";
import { Building2 } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { CABINET_SPECIALTY_MAP } from "@/components/domain/settings/specialty";
import { getAgendaMockAppointments, MOCK_BUSINESS_DATE, MOCK_NOW_TIME, PRACTITIONERS } from "@/features/agenda/mock-data";
import { getCabinetCalendarExceptionsMockData } from "@/features/parametres/mock-calendar-exceptions-data";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import { getCabinetServicesMockData } from "@/features/parametres/mock-cabinet-services-data";
import { getCabinetWorkingHoursMockData } from "@/features/parametres/mock-cabinet-working-hours-data";
import { getLeaveRequestsMockData } from "@/features/team/mock-leave-data";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getWorkIntervalsMockData } from "@/features/team/mock-schedule-data";
import { getBookableServices, getDayAvailability, getSchedulablePractitioners, type AvailabilitySources } from "./availability";
import {
  bookingReducer,
  buildBookingReference,
  buildLocalBookingAppointment,
  createInitialBookingState,
  validateContactForm,
} from "./booking-state";
import { BookingProgress } from "./components/booking-progress";
import { ServiceStep } from "./components/service-step";
import { PractitionerStep } from "./components/practitioner-step";
import { DateSlotStep } from "./components/date-slot-step";
import { PatientDetailsStep } from "./components/patient-details-step";
import { ReviewStep } from "./components/review-step";
import { ConfirmationStep } from "./components/confirmation-step";

/**
 * `/book` — public patient-facing booking journey (UI-012ABCDE). Every
 * source read here is the same real fixture source Paramètres/Équipe/
 * Agenda already own (task §5/§77) — this component never seeds its own
 * services/hours/practitioners/leave/appointments. Session state only
 * (task §52): a page refresh resets the wizard; nothing is written to
 * `localStorage`, and Agenda's own appointment array is never mutated —
 * `sessionBookings` (in `BookingWizardState`) is merged into the
 * availability engine's own appointment source only for the duration of
 * this component's lifetime.
 */
export function PublicBookingPage() {
  const { t } = useLocale();
  const [state, dispatch] = useReducer(bookingReducer, undefined, createInitialBookingState);

  const cabinet = useMemo(() => getCabinetProfileMockData(), []);
  const services = useMemo(() => getCabinetServicesMockData(), []);
  const workingHours = useMemo(() => getCabinetWorkingHoursMockData(), []);
  const calendarExceptions = useMemo(() => getCabinetCalendarExceptionsMockData(), []);
  const workIntervals = useMemo(() => getWorkIntervalsMockData(), []);
  const leaveRequests = useMemo(() => getLeaveRequestsMockData(), []);
  const teamMembers = useMemo(() => getTeamMembersMockData(), []);
  const baseAppointments = useMemo(() => getAgendaMockAppointments(), []);

  const bookableServices = useMemo(() => getBookableServices(services), [services]);
  const schedulablePractitioners = useMemo(() => getSchedulablePractitioners(teamMembers, PRACTITIONERS), [teamMembers]);

  const sources: AvailabilitySources = useMemo(
    () => ({
      cabinetWorkingHours: workingHours,
      cabinetExceptions: calendarExceptions,
      workIntervals,
      leaveRequests,
      appointments: [...baseAppointments, ...state.sessionBookings],
      businessDate: MOCK_BUSINESS_DATE,
      nowTime: MOCK_NOW_TIME,
    }),
    [workingHours, calendarExceptions, workIntervals, leaveRequests, baseAppointments, state.sessionBookings],
  );

  function handleContinueFromDetails() {
    const errors = validateContactForm(state.contact, {
      required: t("booking.details.requiredError"),
      invalidPhone: t("booking.details.invalidPhoneError"),
    });
    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SUBMIT_INVALID", errors });
      return;
    }
    dispatch({ type: "GO_TO_REVIEW" });
  }

  /** Task §47 — re-runs the real engine against current sources immediately before creating the local record, protecting against a stale in-session selection. */
  function handleConfirm() {
    if (!state.service || !state.practitioner || !state.date || !state.slot) return;

    const revalidated = getDayAvailability(state.date, state.service, state.practitioner, sources);
    const stillAvailable = revalidated.isBookable && revalidated.slots.some((slot) => slot.startTime === state.slot?.startTime);

    if (!stillAvailable) {
      dispatch({ type: "SLOT_NO_LONGER_AVAILABLE" });
      return;
    }

    const sequence = state.nextBookingSequence;
    const id = `booking-${sequence}`;
    const appointment = buildLocalBookingAppointment(id, state.service, state.practitioner, state.date, state.slot, state.contact);
    dispatch({
      type: "CONFIRM_BOOKING",
      booking: { id, reference: buildBookingReference(sequence, state.date), appointment },
    });
  }

  const specialtyLabelKey = CABINET_SPECIALTY_MAP[cabinet.specialty].translationKey;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-text">{cabinet.name}</p>
            <p className="text-xs text-text-muted">{t(specialtyLabelKey)}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      {state.step !== "confirmation" && (
        <>
          <h1 className="text-center text-xl font-semibold text-text">{t("booking.hero.title")}</h1>
          <Card>
            <BookingProgress step={state.step} />
          </Card>
        </>
      )}

      <Card>
        {state.step === "service" && (
          <ServiceStep services={bookableServices} onSelect={(service) => dispatch({ type: "SELECT_SERVICE", service })} />
        )}

        {state.step === "practitioner" && (
          <PractitionerStep
            practitioners={schedulablePractitioners}
            onSelect={(practitioner) => dispatch({ type: "SELECT_PRACTITIONER", practitioner })}
            onBack={() => dispatch({ type: "EDIT_STEP", step: "service" })}
          />
        )}

        {state.step === "date" && state.service && state.practitioner && (
          <DateSlotStep
            service={state.service}
            practitioner={state.practitioner}
            sources={sources}
            selectedDate={state.date}
            slotUnavailableNotice={state.slotUnavailableNotice}
            onSelectDate={(date) => dispatch({ type: "SELECT_DATE", date })}
            onSelectSlot={(slot) => dispatch({ type: "SELECT_SLOT", slot })}
            onChangeService={() => dispatch({ type: "EDIT_STEP", step: "service" })}
            onChangePractitioner={() => dispatch({ type: "EDIT_STEP", step: "practitioner" })}
          />
        )}

        {state.step === "details" && (
          <PatientDetailsStep
            contact={state.contact}
            errors={state.contactErrors}
            onFieldChange={(field, value) => dispatch({ type: "UPDATE_CONTACT", field, value })}
            onSubmit={handleContinueFromDetails}
            onBack={() => dispatch({ type: "EDIT_STEP", step: "date" })}
          />
        )}

        {state.step === "review" && state.service && state.practitioner && state.date && state.slot && (
          <ReviewStep
            service={state.service}
            practitioner={state.practitioner}
            date={state.date}
            slot={state.slot}
            contact={state.contact}
            onEdit={() => dispatch({ type: "EDIT_STEP", step: "service" })}
            onConfirm={handleConfirm}
          />
        )}

        {state.step === "confirmation" && state.confirmedBooking && (
          <ConfirmationStep booking={state.confirmedBooking} cabinet={cabinet} onNewBooking={() => dispatch({ type: "RESTART" })} />
        )}
      </Card>
    </div>
  );
}
