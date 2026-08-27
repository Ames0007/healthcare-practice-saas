import type { CommunicationMessage } from "@/components/domain/communication/types";
import type { Patient } from "@/features/patients/types";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { Invoice } from "@/components/domain/finance/types";
import { sortMessagesDesc } from "./communication";
import { buildMessageRows, type MessageRow } from "./messages";

/**
 * Communication's own rolling window (UI-009ABC §13, mirrors Stock's
 * `MOVEMENT_VOLUME_WINDOW_DAYS` pattern) — a shorter default than Stock's
 * 30 days since patient messaging happens at daily/hourly cadence, not
 * weekly. An explicit prototype default, recorded via ADR (like Stock's
 * own 30-day expiry horizon), not silently invented.
 */
export const MESSAGE_VOLUME_WINDOW_DAYS = 7;

/** Whole calendar days from `fromIso` to `dateIso` (positive = in the future). Mirrors `features/stock/lots.ts`'s own `computeDaysUntil` — kept local rather than imported since Stock's version is that module's own, not a shared utility (no shared date-utils module exists in this codebase). */
function computeDaysUntil(dateIso: string, fromIso: string): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((Date.parse(`${dateIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / MS_PER_DAY);
}

export interface CommunicationKpis {
  /** Messages needing a retry (Spec-adjacent operational attention). */
  failedCount: number;
  /** Messages queued/scheduled, not yet handed to the provider. */
  queuedCount: number;
  /** Sent or delivered messages within the last `MESSAGE_VOLUME_WINDOW_DAYS` days. */
  recentVolumeCount: number;
}

/** Cabinet-wide Communication KPIs (UI-009ABC §13) — the three that pair with §14's operational-attention sections, no invented fourth metric. */
export function computeCommunicationKpis(messages: CommunicationMessage[], businessDate: string): CommunicationKpis {
  const failedCount = messages.filter((message) => message.status === "failed").length;
  const queuedCount = messages.filter((message) => message.status === "queued").length;
  const recentVolumeCount = messages.filter((message) => {
    if (message.status !== "sent" && message.status !== "delivered") {
      return false;
    }
    const days = computeDaysUntil(businessDate, message.createdAt.slice(0, 10));
    return days >= 0 && days <= MESSAGE_VOLUME_WINDOW_DAYS;
  }).length;

  return { failedCount, queuedCount, recentVolumeCount };
}

/** Failed messages, newest first — reuses `buildMessageRows`, never a second independent resolution. */
export function getFailedMessageRows(messages: CommunicationMessage[], patients: Patient[], appointments: AgendaAppointment[], invoices: Invoice[]): MessageRow[] {
  return buildMessageRows(sortMessagesDesc(messages.filter((message) => message.status === "failed")), patients, appointments, invoices);
}

/** Queued/pending messages, newest first. */
export function getQueuedMessageRows(messages: CommunicationMessage[], patients: Patient[], appointments: AgendaAppointment[], invoices: Invoice[]): MessageRow[] {
  return buildMessageRows(sortMessagesDesc(messages.filter((message) => message.status === "queued")), patients, appointments, invoices);
}
