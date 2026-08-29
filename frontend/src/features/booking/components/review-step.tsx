"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { formatMad } from "@/features/today/format";
import { formatDayMonthYear } from "@/features/patients/format";
import type { CabinetService } from "@/components/domain/settings/types";
import type { ContactFormValues } from "../booking-state";
import type { BookableSlot, SchedulablePractitioner } from "../types";

export interface ReviewStepProps {
  service: CabinetService;
  practitioner: SchedulablePractitioner;
  date: string;
  slot: BookableSlot;
  contact: ContactFormValues;
  onEdit: () => void;
  onConfirm: () => void;
}

/** Task §46 — every important booking detail before submit; never a hidden field. */
export function ReviewStep({ service, practitioner, date, slot, contact, onEdit, onConfirm }: ReviewStepProps) {
  const { t, locale } = useLocale();

  const rows: { key: string; labelKey: string; value: string }[] = [
    { key: "service", labelKey: "booking.review.serviceLabel", value: service.name },
    { key: "practitioner", labelKey: "booking.review.practitionerLabel", value: practitioner.name },
    { key: "date", labelKey: "booking.review.dateLabel", value: formatDayMonthYear(date, locale) },
    { key: "time", labelKey: "booking.review.timeLabel", value: slot.startTime },
    { key: "duration", labelKey: "booking.review.durationLabel", value: `${service.durationMinutes} ${t("booking.minutesSuffix")}` },
    { key: "price", labelKey: "booking.review.priceLabel", value: formatMad(service.price, locale) },
    { key: "contact", labelKey: "booking.review.contactLabel", value: `${contact.firstName} ${contact.lastName} · ${contact.phone}` },
  ];
  if (contact.note.trim()) {
    rows.push({ key: "note", labelKey: "booking.review.noteLabel", value: contact.note.trim() });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t("booking.review.heading")}</h2>

      <dl className="flex flex-col gap-2 rounded-lg border border-border p-4">
        {rows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-text-muted">{t(row.labelKey)}</dt>
            <dd className="text-end font-medium text-text">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onEdit}>
          {t("booking.review.editAction")}
        </Button>
        <Button type="button" onClick={onConfirm}>
          {t("booking.review.confirmAction")}
        </Button>
      </div>
    </div>
  );
}
