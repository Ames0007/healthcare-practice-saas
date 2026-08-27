"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { COMMUNICATION_CHANNEL_MAP } from "@/components/domain/communication/channel";
import { COMMUNICATION_STATUS_MAP } from "@/components/domain/communication/message-status";
import { COMMUNICATION_PURPOSE_MAP } from "@/components/domain/communication/purpose";
import { formatDayMonthYear, getPatientFullName } from "@/features/communication/format";
import type { MessageRow } from "@/features/communication/messages";

export interface MessageDetailDrawerProps {
  row: MessageRow | null;
  open: boolean;
  onClose: () => void;
  /** Only provided once retry is operational (Gate 3) — no dead button before then (UI-009ABC §19: "Retry becomes operational in Gate 3."). */
  onRetry?: (row: MessageRow) => void;
}

function formatDateTime(iso: string, locale: Parameters<typeof formatDayMonthYear>[1]): string {
  const [datePart, timePart] = iso.split("T");
  const time = timePart?.slice(0, 5);
  return time ? `${formatDayMonthYear(datePart, locale)} · ${time}` : formatDayMonthYear(datePart, locale);
}

/**
 * Read-only message detail (Spec #9 Screen 41, UI-009ABC §19-20) — mirrors
 * `PaymentDetailDrawer`'s exact drawer shape. No edit/delete affordance: a
 * sent/queued message is a communication record, not ordinary CRUD.
 */
export function MessageDetailDrawer({ row, open, onClose, onRetry }: MessageDetailDrawerProps) {
  const { t, locale } = useLocale();

  if (!row) {
    return null;
  }

  const { message, patient, appointment, invoice } = row;
  const channelMeta = COMMUNICATION_CHANNEL_MAP[message.channel];
  const statusMeta = COMMUNICATION_STATUS_MAP[message.status];
  const purposeMeta = COMMUNICATION_PURPOSE_MAP[message.purpose];
  const ChannelIcon = channelMeta.icon;
  const heading = t(purposeMeta.translationKey);

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={heading} closeLabel={t("communication.messages.drawer.close")}>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-text">{heading}</h2>
            <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
          </div>
          {patient && (
            <>
              <p className="mt-2 text-lg font-medium text-text">{getPatientFullName(patient)}</p>
              <p className="text-sm text-text-muted" dir="ltr">
                {patient.patientNumber}
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.messages.drawer.channel")}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-text">
              <ChannelIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t(channelMeta.translationKey)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.messages.drawer.recipient")}</p>
            <p className="mt-1 text-sm text-text" dir="ltr">
              {message.recipient}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.messages.drawer.created")}</p>
            <p className="mt-1 text-sm text-text" dir="ltr">
              {formatDateTime(message.createdAt, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.messages.drawer.sent")}</p>
            <p className="mt-1 text-sm text-text" dir="ltr">
              {message.sentAt ? formatDateTime(message.sentAt, locale) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.messages.drawer.delivered")}</p>
            <p className="mt-1 text-sm text-text" dir="ltr">
              {message.deliveredAt ? formatDateTime(message.deliveredAt, locale) : "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.messages.drawer.message")}</p>
          <p className="mt-1 whitespace-pre-wrap rounded-md border border-border bg-surface-subtle p-3 text-sm text-text">{message.resolvedBody}</p>
        </div>

        {appointment && patient && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.messages.drawer.relatedAppointment")}</p>
            <p className="text-sm text-text" dir="ltr">
              {formatDayMonthYear(appointment.date, locale)} · {appointment.time}
            </p>
            <p className="text-sm text-text-secondary">{appointment.service}</p>
            <Link href={`/app/patients/${patient.id}/appointments`} className="mt-1 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline">
              {t("communication.messages.drawer.viewAppointment")}
            </Link>
          </div>
        )}

        {invoice && patient && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.messages.drawer.relatedInvoice")}</p>
            <p className="text-sm text-text" dir="ltr">
              {invoice.invoiceNumber}
            </p>
            <Link href={`/app/patients/${patient.id}/invoices`} className="mt-1 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline">
              {t("communication.messages.drawer.viewInvoice")}
            </Link>
          </div>
        )}

        {message.status === "failed" && message.failureReason && (
          <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            <p className="font-medium">{t("communication.messages.drawer.failureLabel")}</p>
            <p>{message.failureReason}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {patient && (
            <Link href={`/app/patients/${patient.id}`} className="text-sm font-medium text-primary underline-offset-2 hover:underline">
              {t("communication.messages.drawer.openPatient")}
            </Link>
          )}
          {message.status === "failed" && onRetry && (
            <Button variant="outline" size="sm" onClick={() => onRetry(row)}>
              {t("communication.messages.drawer.retry")}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
