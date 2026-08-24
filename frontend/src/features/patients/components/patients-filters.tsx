"use client";

import { Search } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PRACTITIONERS } from "@/features/patients/mock-data";
import type { NextAppointmentFilter } from "@/features/patients/types";

export interface PatientsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  practitionerId: string;
  onPractitionerChange: (value: string) => void;
  nextAppointment: NextAppointmentFilter;
  onNextAppointmentChange: (value: NextAppointmentFilter) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  resultCount: number;
}

/** Search + lightweight filters (UI-003A §15-19) — local, no debounce needed for a small mock dataset. */
export function PatientsFilters({
  search,
  onSearchChange,
  practitionerId,
  onPractitionerChange,
  nextAppointment,
  onNextAppointmentChange,
  hasActiveFilters,
  onClearFilters,
  resultCount,
}: PatientsFiltersProps) {
  const { t } = useLocale();

  const nextAppointmentOptions: { value: NextAppointmentFilter; label: string }[] = [
    { value: "all", label: t("patients.filters.nextAppointmentAll") },
    { value: "today", label: t("patients.filters.nextAppointmentToday") },
    { value: "upcoming", label: t("patients.filters.nextAppointmentUpcoming") },
    { value: "none", label: t("patients.filters.nextAppointmentNone") },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label={t("patients.searchLabel")}
            placeholder={t("patients.searchLabel")}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="ps-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label={t("patients.filters.practitionerLabel")}
            value={practitionerId}
            onChange={(event) => onPractitionerChange(event.target.value)}
            options={[
              { value: "all", label: t("patients.filters.allPractitioners") },
              ...PRACTITIONERS.map((practitioner) => ({ value: practitioner.id, label: practitioner.name })),
            ]}
            className="w-auto"
          />
          <Select
            aria-label={t("patients.filters.nextAppointmentLabel")}
            value={nextAppointment}
            onChange={(event) => onNextAppointmentChange(event.target.value as NextAppointmentFilter)}
            options={nextAppointmentOptions}
            className="w-auto"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted" aria-live="polite">
          {t("patients.resultCount", { count: resultCount })}
        </p>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
            {t("patients.filters.clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
