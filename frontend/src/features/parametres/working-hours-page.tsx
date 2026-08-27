"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import type { CabinetWorkingHoursDay } from "@/components/domain/settings/types";
import { WEEKDAY_ORDER } from "@/features/team/schedule";
import { getCabinetWorkingHoursMockData } from "./mock-cabinet-working-hours-data";
import {
  buildInitialWorkingHoursFormValues,
  buildWorkingHoursFromFormValues,
  isValidWorkingHoursForm,
  type CabinetWorkingHoursFormValues,
} from "./working-hours";
import { ParametresNav } from "./components/parametres-nav";
import { SettingsSkeleton } from "./components/settings-skeleton";

export type WorkingHoursPageState = "loading" | "loaded" | "error";

export interface WorkingHoursPageProps {
  days?: CabinetWorkingHoursDay[];
  state?: WorkingHoursPageState;
  onRetry?: () => void;
}

/**
 * Cabinet Working Hours (UI-010ABC Gate 3), `/app/parametres/horaires`.
 * Cabinet-wide only, not per-practitioner (see `CabinetWorkingHoursDay`'s
 * own doc comment for the unresolved specification gap this deliberately
 * sidesteps). View/edit toggle mirrors `CabinetSettingsPage`'s own single-
 * record pattern — one weekly schedule, not a list.
 */
export function WorkingHoursPage({ days: providedDays, state = "loaded", onRetry }: WorkingHoursPageProps) {
  const { t } = useLocale();
  const [days, setDays] = useState<CabinetWorkingHoursDay[]>(() => providedDays ?? getCabinetWorkingHoursMockData());
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<CabinetWorkingHoursFormValues>(() => buildInitialWorkingHoursFormValues(days));
  const [showValidityError, setShowValidityError] = useState(false);

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

  function startEditing() {
    setValues(buildInitialWorkingHoursFormValues(days));
    setShowValidityError(false);
    setEditing(true);
  }

  function cancelEditing() {
    setShowValidityError(false);
    setEditing(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidWorkingHoursForm(values)) {
      setShowValidityError(true);
      return;
    }
    setDays(buildWorkingHoursFromFormValues(values));
    setEditing(false);
  }

  const byWeekday = new Map(days.map((day) => [day.weekday, day]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("parametres.horaires.pageTitle")}
        description={t("parametres.horaires.pageDescription")}
        primaryAction={
          !editing ? (
            <Button size="sm" onClick={startEditing}>
              {t("parametres.horaires.editAction")}
            </Button>
          ) : undefined
        }
      />

      <ParametresNav />

      <Card>
        {!editing ? (
          <ul className="flex flex-col divide-y divide-border">
            {WEEKDAY_ORDER.map((weekday) => {
              const day = byWeekday.get(weekday);
              return (
                <li key={weekday} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-text">{t(`team.weekday.${weekday}`)}</span>
                  <span className={day?.isOpen ? "text-text" : "text-text-muted"}>
                    {day?.isOpen ? `${day.startTime} – ${day.endTime}` : t("parametres.horaires.closed")}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {WEEKDAY_ORDER.map((weekday) => {
              const day = values[weekday];
              return (
                <div key={weekday} className="flex flex-wrap items-end gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <label className="flex w-32 items-center gap-2 text-sm font-medium text-text">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [weekday]: { ...current[weekday], isOpen: event.target.checked } }))
                      }
                      className="h-4 w-4 rounded border-border-strong"
                    />
                    {t(`team.weekday.${weekday}`)}
                  </label>

                  {day.isOpen ? (
                    <>
                      <Input
                        label={t("parametres.horaires.startLabel")}
                        type="time"
                        value={day.startTime}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, [weekday]: { ...current[weekday], startTime: event.target.value } }))
                        }
                      />
                      <Input
                        label={t("parametres.horaires.endLabel")}
                        type="time"
                        value={day.endTime}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, [weekday]: { ...current[weekday], endTime: event.target.value } }))
                        }
                      />
                    </>
                  ) : (
                    <span className="text-sm text-text-muted">{t("parametres.horaires.closed")}</span>
                  )}
                </div>
              );
            })}

            {showValidityError && <p className="text-sm text-danger">{t("parametres.horaires.invalidError")}</p>}

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={cancelEditing}>
                {t("parametres.horaires.cancel")}
              </Button>
              <Button type="submit">{t("parametres.horaires.save")}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
