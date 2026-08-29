"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import type { CabinetService } from "@/components/domain/settings/types";
import { type AvailabilitySources, getMonthAvailability } from "../availability";
import type { BookableSlot, SchedulablePractitioner } from "../types";
import { AvailabilityCalendar } from "./availability-calendar";
import { SlotList } from "./slot-list";

/**
 * UI-layer navigation convenience only (task §34: "Do not allow navigating
 * into meaningless unrestricted years") — NOT an availability-engine
 * business rule. No booking horizon is implemented anywhere in
 * `AppointmentSettings`/the approved specifications (task §18), so the
 * engine itself never rejects a date on this basis; this constant only
 * bounds how far the calendar's own month-navigation UI can scroll. See
 * ADR-017.
 */
const MONTH_NAVIGATION_WINDOW_MONTHS = 3;

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}

export interface DateSlotStepProps {
  service: CabinetService;
  practitioner: SchedulablePractitioner;
  sources: AvailabilitySources;
  selectedDate: string | null;
  slotUnavailableNotice: boolean;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: BookableSlot) => void;
  onChangeService: () => void;
  onChangePractitioner: () => void;
}

export function DateSlotStep({
  service,
  practitioner,
  sources,
  selectedDate,
  slotUnavailableNotice,
  onSelectDate,
  onSelectSlot,
  onChangeService,
  onChangePractitioner,
}: DateSlotStepProps) {
  const { t } = useLocale();
  const [businessYear, businessMonth] = sources.businessDate.split("-").map(Number);
  const minMonth = { year: businessYear, month: businessMonth };
  const maxMonth = shiftMonth(minMonth.year, minMonth.month, MONTH_NAVIGATION_WINDOW_MONTHS);
  const [visibleMonth, setVisibleMonth] = useState(minMonth);

  const monthDays = useMemo(
    () => getMonthAvailability(visibleMonth.year, visibleMonth.month, service, practitioner, sources),
    [visibleMonth, service, practitioner, sources],
  );

  const selectedDay = selectedDate ? (monthDays.find((day) => day.date === selectedDate) ?? null) : null;
  const hasAnyAvailabilityThisMonth = monthDays.some((day) => day.isBookable);

  const canGoPrevious = visibleMonth.year > minMonth.year || (visibleMonth.year === minMonth.year && visibleMonth.month > minMonth.month);
  const canGoNext = visibleMonth.year < maxMonth.year || (visibleMonth.year === maxMonth.year && visibleMonth.month < maxMonth.month);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <button type="button" onClick={onChangeService} className="text-sm font-medium text-primary hover:underline">
          {t("booking.date.changeService")}
        </button>
        <button type="button" onClick={onChangePractitioner} className="text-sm font-medium text-primary hover:underline">
          {t("booking.date.changePractitioner")}
        </button>
      </div>

      <h2 className="text-lg font-semibold text-text">{t("booking.date.heading")}</h2>

      {slotUnavailableNotice && (
        <div className="rounded-md border border-warning bg-warning-soft p-3 text-sm text-warning">
          {t("booking.date.slotNoLongerAvailable")}
        </div>
      )}

      <AvailabilityCalendar
        year={visibleMonth.year}
        month={visibleMonth.month}
        days={monthDays}
        selectedDate={selectedDate}
        businessDate={sources.businessDate}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPreviousMonth={() => setVisibleMonth((current) => shiftMonth(current.year, current.month, -1))}
        onNextMonth={() => setVisibleMonth((current) => shiftMonth(current.year, current.month, 1))}
        onSelectDate={onSelectDate}
      />

      {!hasAnyAvailabilityThisMonth && (
        <div className="rounded-md border border-dashed border-border p-3 text-center text-sm text-text-muted">
          <p>{t("booking.date.noAvailabilityInPeriod")}</p>
          <p className="mt-1">{t("booking.date.noAvailabilityHint")}</p>
        </div>
      )}

      <SlotList day={selectedDay} onSelectSlot={onSelectSlot} />
    </div>
  );
}
