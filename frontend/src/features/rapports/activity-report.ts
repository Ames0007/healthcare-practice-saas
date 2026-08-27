import { APPOINTMENT_STATUS_ORDER } from "@/components/domain/appointments/appointment-status";
import type { MoneyAmount } from "@/components/domain/finance/types";
import type {
  ActivityReportKpis,
  AppointmentStatusBreakdownRow,
  PractitionerActivityRow,
} from "@/components/domain/reports/types";
import type { PeriodRange } from "@/features/finance/aggregations";
import type { AgendaAppointment, AgendaPractitioner } from "@/features/agenda/types";
import type { Invoice, Payment } from "@/components/domain/finance/types";

/** ISO `YYYY-MM-DD` strings compare correctly with plain string operators (mirrors `features/finance/aggregations.ts`'s own `isWithinRange`). */
function isWithinRange(dateIso: string, range: PeriodRange): boolean {
  return dateIso >= range.start && dateIso <= range.end;
}

/**
 * Cabinet-wide activity KPIs for the selected period (Spec #2 §42.1),
 * derived entirely from the existing Agenda fixture — never a second
 * appointment count.
 */
export function computeActivityReportKpis(appointments: AgendaAppointment[], range: PeriodRange): ActivityReportKpis {
  const inRange = appointments.filter((appointment) => isWithinRange(appointment.date, range));
  const appointmentsCount = inRange.length;

  const patientsSeenCount = new Set(
    inRange.filter((appointment) => appointment.status === "completed").map((appointment) => appointment.patientId),
  ).size;

  const noShowCount = inRange.filter((appointment) => appointment.status === "no_show").length;
  const noShowRatePercent = appointmentsCount > 0 ? Math.round((noShowCount / appointmentsCount) * 1000) / 10 : 0;

  return { appointmentsCount, patientsSeenCount, noShowRatePercent };
}

/**
 * Objective per-status counts for the selected period — the bounded,
 * formula-free alternative to an invented "confirmation rate" (see
 * `ActivityReportKpis`'s own doc comment). Only statuses actually present
 * in the period are returned, ordered via `APPOINTMENT_STATUS_ORDER`.
 */
export function buildAppointmentStatusBreakdown(
  appointments: AgendaAppointment[],
  range: PeriodRange,
): AppointmentStatusBreakdownRow[] {
  const inRange = appointments.filter((appointment) => isWithinRange(appointment.date, range));
  const counts = new Map<string, number>();

  for (const appointment of inRange) {
    counts.set(appointment.status, (counts.get(appointment.status) ?? 0) + 1);
  }

  return APPOINTMENT_STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({
    status,
    count: counts.get(status)!,
  }));
}

/**
 * One row per practitioner (Spec #3 WF-72), joined by `practitionerName` —
 * the same display-name string both `AgendaAppointment` and `Invoice`
 * already carry (neither fixture set has a shared numeric id here, so
 * this mirrors `buildRecentActivity`'s own name-based join discipline
 * rather than inventing a new cross-reference field). Collected amount is
 * resolved via each payment's own first allocation, exactly like
 * `buildRecentActivity` already does — never a second invoice/payment
 * link.
 */
export function buildPractitionerActivityRows(
  appointments: AgendaAppointment[],
  invoices: Invoice[],
  payments: Payment[],
  practitioners: AgendaPractitioner[],
  range: PeriodRange,
): PractitionerActivityRow[] {
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));

  const collectedByPractitionerName = new Map<string, MoneyAmount>();
  for (const payment of payments) {
    if (payment.status !== "posted" || !isWithinRange(payment.paymentDate, range)) continue;
    const invoiceId = payment.allocations[0]?.invoiceId;
    const practitionerName = invoiceId ? invoiceById.get(invoiceId)?.practitionerName : undefined;
    if (!practitionerName) continue;
    collectedByPractitionerName.set(practitionerName, (collectedByPractitionerName.get(practitionerName) ?? 0) + payment.amount);
  }

  const inRangeAppointments = appointments.filter((appointment) => isWithinRange(appointment.date, range));

  return practitioners.map((practitioner) => {
    const own = inRangeAppointments.filter((appointment) => appointment.practitionerName === practitioner.name);

    return {
      practitionerId: practitioner.id,
      practitionerName: practitioner.name,
      appointmentsCount: own.length,
      completedCount: own.filter((appointment) => appointment.status === "completed").length,
      noShowCount: own.filter((appointment) => appointment.status === "no_show").length,
      collectedAmount: collectedByPractitionerName.get(practitioner.name) ?? 0,
    };
  });
}
