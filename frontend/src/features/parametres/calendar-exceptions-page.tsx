"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import type { CabinetCalendarException, CabinetWorkingHoursDay } from "@/components/domain/settings/types";
import { CALENDAR_EXCEPTION_TYPE_MAP } from "@/components/domain/settings/calendar-exception-type";
import type { AgendaAppointment } from "@/features/agenda/types";
import { getAgendaMockAppointments } from "@/features/agenda/mock-data";
import { formatDayMonth } from "@/features/patients/format";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getCabinetWorkingHoursMockData } from "./mock-cabinet-working-hours-data";
import { getCabinetCalendarExceptionsMockData } from "./mock-calendar-exceptions-data";
import { groupExceptionsByMonth, isPastException } from "./calendar-exceptions";
import { ParametresNav } from "./components/parametres-nav";
import { HorairesNav } from "./components/horaires-nav";
import { SettingsSkeleton } from "./components/settings-skeleton";
import { CalendarExceptionFormDialog } from "./components/calendar-exception-form-dialog";

export type CalendarExceptionsPageState = "loading" | "loaded" | "error";

export interface CalendarExceptionsPageProps {
  exceptions?: CabinetCalendarException[];
  workingHours?: CabinetWorkingHoursDay[];
  appointments?: AgendaAppointment[];
  businessDate?: string;
  state?: CalendarExceptionsPageState;
  onRetry?: () => void;
}

type FormDialogState = { mode: "create" } | { mode: "edit"; exception: CabinetCalendarException };

/**
 * Calendrier & exceptions (UI-AGENDA-X), `/app/parametres/horaires/exceptions`
 * — additive to the existing "Horaires habituelles" screen (task §2), never
 * replacing it. Past exceptions (`isPastException`) stay read-only history
 * (task §20) — no Modifier/Supprimer action renders for them, only future/
 * today ones are editable/removable. Removing an exception never deletes
 * history-worthy data beyond this prototype's own local session state —
 * it simply falls back to `CabinetWorkingHoursDay`'s own weekly pattern
 * for that date (task §19).
 */
export function CalendarExceptionsPage({
  exceptions: providedExceptions,
  workingHours: providedWorkingHours,
  appointments: providedAppointments,
  businessDate = MOCK_BUSINESS_DATE,
  state = "loaded",
  onRetry,
}: CalendarExceptionsPageProps) {
  const { t, locale } = useLocale();
  const [overrideExceptions, setOverrideExceptions] = useState<CabinetCalendarException[] | null>(null);
  const [formDialog, setFormDialog] = useState<FormDialogState | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (state === "loading") {
    return <SettingsSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("parametres.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("parametres.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const workingHours = providedWorkingHours ?? getCabinetWorkingHoursMockData();
  const appointments = providedAppointments ?? getAgendaMockAppointments();
  const seedExceptions = providedExceptions ?? getCabinetCalendarExceptionsMockData();
  const exceptions = overrideExceptions ?? seedExceptions;
  const monthGroups = groupExceptionsByMonth(exceptions, locale);

  function handleSubmit(exception: CabinetCalendarException) {
    const isEdit = formDialog?.mode === "edit";
    setOverrideExceptions(
      isEdit ? exceptions.map((candidate) => (candidate.id === exception.id ? exception : candidate)) : [...exceptions, exception],
    );
    setFormDialog(null);
    setToastMessage(t(isEdit ? "parametres.horaires.exceptions.toast.updated" : "parametres.horaires.exceptions.toast.created"));
  }

  function handleRemove() {
    if (!removingId) return;
    setOverrideExceptions(exceptions.filter((exception) => exception.id !== removingId));
    setRemovingId(null);
    setToastMessage(t("parametres.horaires.exceptions.toast.removed"));
  }

  const removingException = exceptions.find((exception) => exception.id === removingId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("parametres.horaires.exceptions.pageTitle")}
        description={t("parametres.horaires.exceptions.pageDescription")}
        primaryAction={
          <Button size="sm" onClick={() => setFormDialog({ mode: "create" })}>
            {t("parametres.horaires.exceptions.addButton")}
          </Button>
        }
      />

      <ParametresNav />

      <HorairesNav />

      {exceptions.length === 0 ? (
        <EmptyState
          title={t("parametres.horaires.exceptions.emptyTitle")}
          description={t("parametres.horaires.exceptions.emptyDescription")}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {monthGroups.map((group) => (
            <div key={group.monthKey} className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{group.monthLabel}</h2>
              <Card className="p-0">
                <ul className="flex flex-col divide-y divide-border">
                  {group.exceptions.map((exception) => {
                    const typeMeta = CALENDAR_EXCEPTION_TYPE_MAP[exception.type];
                    const past = isPastException(exception.date, businessDate);

                    return (
                      <li key={exception.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-text">{formatDayMonth(exception.date, locale)}</span>
                          <span dir="ltr" className="text-text-secondary">
                            {typeMeta.isClosed
                              ? t("parametres.horaires.exceptions.closedLabel")
                              : exception.intervals.map((interval) => `${interval.startTime}–${interval.endTime}`).join(", ")}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone={typeMeta.tone}>{t(typeMeta.translationKey)}</StatusBadge>
                            {exception.reason && <span className="text-text-muted">{exception.reason}</span>}
                          </div>
                          {past && <span className="text-xs text-text-muted">{t("parametres.horaires.exceptions.pastNotice")}</span>}
                        </div>

                        {!past && (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => setFormDialog({ mode: "edit", exception })}>
                              {t("parametres.horaires.exceptions.editAction")}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setRemovingId(exception.id)}>
                              {t("parametres.horaires.exceptions.removeAction")}
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      )}

      {formDialog && (
        <CalendarExceptionFormDialog
          key={formDialog.mode === "edit" ? formDialog.exception.id : "create"}
          open
          onClose={() => setFormDialog(null)}
          onSubmit={handleSubmit}
          existing={formDialog.mode === "edit" ? formDialog.exception : undefined}
          exceptions={exceptions}
          workingHours={workingHours}
          appointments={appointments}
        />
      )}

      <ConfirmDialog
        open={removingException !== undefined}
        onClose={() => setRemovingId(null)}
        onConfirm={handleRemove}
        title={t("parametres.horaires.exceptions.delete.title")}
        description={t("parametres.horaires.exceptions.delete.description")}
        cancelLabel={t("parametres.horaires.exceptions.delete.cancel")}
        confirmLabel={t("parametres.horaires.exceptions.delete.confirm")}
        tone="danger"
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
