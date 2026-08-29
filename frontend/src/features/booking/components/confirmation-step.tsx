"use client";

import { CheckCircle2 } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { formatDayMonthYear } from "@/features/patients/format";
import type { CabinetProfile } from "@/components/domain/settings/types";
import type { LocalBooking } from "../booking-state";

export interface ConfirmationStepProps {
  booking: LocalBooking;
  cabinet: CabinetProfile;
  onNewBooking: () => void;
}

/**
 * Task §53/§54 — wording matches the initial `"requested"` status exactly
 * (Spec #9 Screen 52): never claims the appointment is confirmed, never
 * claims a message was actually sent (no real WhatsApp/SMS provider
 * exists in this prototype, task §54).
 */
export function ConfirmationStep({ booking, cabinet, onNewBooking }: ConfirmationStepProps) {
  const { t, locale } = useLocale();
  const appointment = booking.appointment;

  const rows: { key: string; labelKey: string; value: string }[] = [
    { key: "reference", labelKey: "booking.confirmation.referenceLabel", value: booking.reference },
    { key: "service", labelKey: "booking.confirmation.serviceLabel", value: appointment.service },
    { key: "practitioner", labelKey: "booking.confirmation.practitionerLabel", value: appointment.practitionerName },
    { key: "date", labelKey: "booking.confirmation.dateLabel", value: formatDayMonthYear(appointment.date, locale) },
    { key: "time", labelKey: "booking.confirmation.timeLabel", value: appointment.time },
  ];

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
      </span>

      <div>
        <h2 className="text-lg font-semibold text-text">{t("booking.confirmation.heading")}</h2>
        <p className="mt-1 text-sm text-text">{t("booking.confirmation.message")}</p>
      </div>

      <p className="text-sm text-text-muted">{t("booking.confirmation.pendingNotice")}</p>
      <p className="text-sm text-text-muted">{t("booking.confirmation.communicationNotice")}</p>

      <dl className="flex w-full flex-col gap-2 rounded-lg border border-border p-4 text-start">
        {rows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-text-muted">{t(row.labelKey)}</dt>
            <dd className="font-medium text-text">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="text-sm text-text-muted">
        <p className="font-medium text-text">{cabinet.name}</p>
        <p>{cabinet.phone}</p>
      </div>

      <Button type="button" onClick={onNewBooking} className="w-full">
        {t("booking.confirmation.newBookingAction")}
      </Button>
    </div>
  );
}
