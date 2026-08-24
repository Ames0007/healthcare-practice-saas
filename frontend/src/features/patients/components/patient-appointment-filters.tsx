"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import type { AppointmentFilterGroup } from "@/features/patients/patient-appointments";

const FILTER_ORDER: AppointmentFilterGroup[] = ["all", "upcoming", "completed", "cancelled", "noShow"];

export interface PatientAppointmentFiltersProps {
  active: AppointmentFilterGroup;
  onChange: (group: AppointmentFilterGroup) => void;
  resultCount: number;
}

/** Lightweight status-group filter (UI-004B §17-19) — mirrors the segmented Day/Week toggle style used by Agenda's own header. */
export function PatientAppointmentFilters({ active, onChange, resultCount }: PatientAppointmentFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        className="flex flex-wrap items-center gap-1 rounded-md border border-border-strong p-1"
        role="group"
        aria-label={t("patientDetail.tabs.appointments")}
      >
        {FILTER_ORDER.map((group) => (
          <Button
            key={group}
            type="button"
            variant={active === group ? "primary" : "ghost"}
            size="sm"
            aria-pressed={active === group}
            onClick={() => onChange(group)}
          >
            {t(`patientDetail.appointments.filters.${group}`)}
          </Button>
        ))}
      </div>
      <p className="text-sm text-text-muted" aria-live="polite">
        {t("patientDetail.appointments.resultCount", { count: resultCount })}
      </p>
    </div>
  );
}
