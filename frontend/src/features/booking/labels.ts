import type { UnavailableReason } from "./types";

/**
 * The single place an internal `UnavailableReason` becomes public-facing
 * copy (task §22/§35/§38/§66). `practitioner_on_leave` and
 * `practitioner_not_scheduled` deliberately collapse onto the exact same
 * generic label as every other non-closure reason — the public UI must
 * never let a patient distinguish "this practitioner is on leave" from any
 * other kind of unavailability (task §38: "Do not publicly expose 'Dr. X
 * is on annual leave'... Simply show practitioner/date unavailable").
 * `cabinet_closed`/`holiday` share one "closed" label, deliberately
 * distinct from `fully_booked`'s own "Complet" (task §37).
 */
export function getUnavailableReasonLabelKey(reason: UnavailableReason | undefined): string {
  switch (reason) {
    case "past_date":
      return "booking.date.reasonPast";
    case "fully_booked":
      return "booking.date.reasonFull";
    case "cabinet_closed":
    case "holiday":
      return "booking.date.reasonClosed";
    case "practitioner_not_scheduled":
    case "practitioner_on_leave":
    default:
      return "booking.date.reasonUnavailable";
  }
}
