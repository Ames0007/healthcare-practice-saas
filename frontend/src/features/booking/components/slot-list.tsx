"use client";

import { useLocale } from "@/i18n/locale-provider";
import { formatDayMonth } from "@/features/patients/format";
import { getUnavailableReasonLabelKey } from "../labels";
import type { BookableSlot, DayAvailability } from "../types";

export interface SlotListProps {
  day: DayAvailability | null;
  onSelectSlot: (slot: BookableSlot) => void;
}

/** Task §39 — every slot is a real, keyboard-accessible button; no internal appointment id is ever rendered. */
export function SlotList({ day, onSelectSlot }: SlotListProps) {
  const { t, locale } = useLocale();

  if (!day) {
    return <p className="text-sm text-text-muted">{t("booking.date.selectDatePrompt")}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-text">
        {t("booking.date.slotsHeadingFor", { date: formatDayMonth(day.date, locale) })}
      </p>

      {day.isBookable ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {day.slots.map((slot) => (
            <button
              key={slot.startTime}
              type="button"
              onClick={() => onSelectSlot(slot)}
              className="rounded-md border border-border-strong px-2 py-2 text-sm font-medium text-text hover:border-primary hover:bg-primary-soft"
            >
              {slot.startTime}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">{t(getUnavailableReasonLabelKey(day.reason))}</p>
      )}
    </div>
  );
}
