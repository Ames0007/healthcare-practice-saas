"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";
import { formatMonthYear } from "@/features/parametres/calendar-exceptions";
import { formatWeekdayShort, getWeekDates, getWeekStart } from "@/features/agenda/format";
import { WEEKDAY_ORDER, getWeekdayFromIso } from "@/features/team/schedule";
import { getUnavailableReasonLabelKey } from "../labels";
import type { DayAvailability } from "../types";

export interface AvailabilityCalendarProps {
  year: number;
  month: number;
  days: DayAvailability[];
  selectedDate: string | null;
  businessDate: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: string) => void;
}

/**
 * Public-facing availability calendar (task §33) — a purpose-built
 * month-grid, distinct from the internal Agenda's own `<input type=date>`
 * appointment form (that admin control has no per-day availability to
 * visualize; this one must, task §33/§36/§37). Availability/unavailability
 * is never color-only (task §33): unavailable days also get a strikethrough
 * and `disabled`/non-interactive state, and every unavailable day's own
 * `aria-label` names the (privacy-safe) reason.
 */
export function AvailabilityCalendar({
  year,
  month,
  days,
  selectedDate,
  businessDate,
  canGoPrevious,
  canGoNext,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
}: AvailabilityCalendarProps) {
  const { t, locale } = useLocale();
  const monthLabel = formatMonthYear(`${year}-${String(month).padStart(2, "0")}-01`, locale);
  const weekdayLabels = getWeekDates(getWeekStart(businessDate)).map((date) => formatWeekdayShort(date, locale));
  const leadingBlanks = days.length > 0 ? WEEKDAY_ORDER.indexOf(getWeekdayFromIso(days[0].date)) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPreviousMonth}
          disabled={!canGoPrevious}
          aria-label={t("booking.date.previousMonth")}
          className="rounded-md p-1.5 text-text-muted hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </button>
        <p className="text-sm font-medium capitalize text-text">{monthLabel}</p>
        <button
          type="button"
          onClick={onNextMonth}
          disabled={!canGoNext}
          aria-label={t("booking.date.nextMonth")}
          className="rounded-md p-1.5 text-text-muted hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-muted">
        {weekdayLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          const dayNumber = Number(day.date.slice(-2));
          const reasonLabel = day.isBookable ? null : t(getUnavailableReasonLabelKey(day.reason));

          return (
            <button
              key={day.date}
              type="button"
              disabled={!day.isBookable}
              onClick={() => onSelectDate(day.date)}
              aria-pressed={day.isBookable ? isSelected : undefined}
              aria-label={day.isBookable ? undefined : `${dayNumber} — ${reasonLabel}`}
              className={cn(
                "flex h-10 items-center justify-center rounded-md text-sm transition-colors duration-150",
                !day.isBookable && "cursor-not-allowed text-text-muted line-through decoration-1",
                day.isBookable && !isSelected && "border border-transparent text-text hover:border-border hover:bg-surface-subtle",
                isSelected && "bg-primary font-semibold text-primary-foreground",
              )}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          {t("booking.date.legendSelected")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-border-strong" aria-hidden="true" />
          {t("booking.date.legendAvailable")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-border-strong opacity-40" aria-hidden="true" />
          {t("booking.date.legendUnavailable")}
        </span>
      </div>
    </div>
  );
}
