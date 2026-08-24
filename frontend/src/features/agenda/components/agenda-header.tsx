"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { AgendaPractitioner } from "@/features/agenda/types";

export type AgendaViewMode = "day" | "week";
export type AgendaActiveView = "agenda" | "waiting";

export interface AgendaHeaderProps {
  dateLabel: string;
  viewMode: AgendaViewMode;
  onViewModeChange: (mode: AgendaViewMode) => void;
  onNavigate: (direction: "prev" | "next" | "today") => void;
  practitioners: AgendaPractitioner[];
  practitionerFilter: string;
  onPractitionerFilterChange: (id: string) => void;
  activeView: AgendaActiveView;
  onActiveViewChange: (view: AgendaActiveView) => void;
  onNewAppointment: () => void;
}

/**
 * Agenda's persistent controls (§5): date nav, day/week toggle,
 * practitioner filter, waiting-room toggle, new appointment. Deliberately
 * flat and concise — not a generic FilterBar abstraction for one screen.
 */
export function AgendaHeader({
  dateLabel,
  viewMode,
  onViewModeChange,
  onNavigate,
  practitioners,
  practitionerFilter,
  onPractitionerFilterChange,
  activeView,
  onActiveViewChange,
  onNewAppointment,
}: AgendaHeaderProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-text">{t("agenda.pageTitle")}</h1>
        <Button size="sm" onClick={onNewAppointment}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("agenda.newAppointment")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1" role="group" aria-label={t("agenda.dateNavigation")}>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("agenda.previous")}
            onClick={() => onNavigate("prev")}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("today")}>
            {t("agenda.today")}
          </Button>
          <Button variant="outline" size="icon" aria-label={t("agenda.next")} onClick={() => onNavigate("next")}>
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <span className="ms-2 text-sm font-medium text-text">{dateLabel}</span>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-border-strong p-1" role="group" aria-label={t("agenda.viewMode")}>
          <Button
            variant={viewMode === "day" ? "primary" : "ghost"}
            size="sm"
            aria-pressed={viewMode === "day"}
            onClick={() => onViewModeChange("day")}
          >
            {t("agenda.day")}
          </Button>
          <Button
            variant={viewMode === "week" ? "primary" : "ghost"}
            size="sm"
            aria-pressed={viewMode === "week"}
            onClick={() => onViewModeChange("week")}
          >
            {t("agenda.week")}
          </Button>
        </div>

        <Select
          aria-label={t("agenda.practitioner")}
          className="w-auto"
          value={practitionerFilter}
          onChange={(event) => onPractitionerFilterChange(event.target.value)}
          options={[
            { value: "all", label: t("agenda.allPractitioners") },
            ...practitioners.map((practitioner) => ({ value: practitioner.id, label: practitioner.name })),
          ]}
        />

        <Button
          variant={activeView === "waiting" ? "primary" : "outline"}
          size="sm"
          aria-pressed={activeView === "waiting"}
          onClick={() => onActiveViewChange(activeView === "waiting" ? "agenda" : "waiting")}
        >
          {t("agenda.waitingRoom")}
        </Button>
      </div>
    </div>
  );
}
