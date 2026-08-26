"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Weekday, WorkDayFormValues, WorkWeekFormValues } from "@/components/domain/team/types";
import { WEEKDAY_ORDER, intervalsAreSequential, isValidWorkInterval } from "@/features/team/schedule";

export interface WorkScheduleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: WorkWeekFormValues) => void;
  initialValues: WorkWeekFormValues;
}

type FieldErrors = Partial<Record<Weekday, { interval1?: string; interval2?: string }>>;

function updateDay(values: WorkWeekFormValues, weekday: Weekday, patch: Partial<WorkDayFormValues>): WorkWeekFormValues {
  return { ...values, [weekday]: { ...values[weekday], ...patch } };
}

/**
 * Bounded weekly work-schedule edit prototype (UI-007B §9), one row per
 * weekday, at most 2 intervals per day (a split-shift lunch break covers
 * the realistic case without unbounded complexity, §7). Submitting always
 * replaces the member's *entire* interval set — this is not a per-
 * interval CRUD surface, mirroring `CashCountDialog`'s own "one validated
 * result object" shape rather than field-by-field mutation.
 */
export function WorkScheduleFormDialog({ open, onClose, onSubmit, initialValues }: WorkScheduleFormDialogProps) {
  const { t } = useLocale();
  const [values, setValues] = useState<WorkWeekFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};

    for (const weekday of WEEKDAY_ORDER) {
      const day = values[weekday];
      if (!day.worked) continue;

      const dayErrors: { interval1?: string; interval2?: string } = {};

      if (!isValidWorkInterval(day.interval1Start, day.interval1End)) {
        dayErrors.interval1 = t("teamDetail.schedule.form.intervalError");
      }

      if (day.hasSecondInterval) {
        if (!isValidWorkInterval(day.interval2Start, day.interval2End)) {
          dayErrors.interval2 = t("teamDetail.schedule.form.intervalError");
        } else if (!dayErrors.interval1 && !intervalsAreSequential(day.interval1End, day.interval2Start)) {
          dayErrors.interval2 = t("teamDetail.schedule.form.overlapError");
        }
      }

      if (dayErrors.interval1 || dayErrors.interval2) {
        nextErrors[weekday] = dayErrors;
      }
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(values);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="drawer"
      label={t("teamDetail.schedule.form.title")}
      closeLabel={t("team.form.close")}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{t("teamDetail.schedule.form.title")}</h2>

        <div className="flex flex-col gap-4">
          {WEEKDAY_ORDER.map((weekday) => {
            const day = values[weekday];
            const dayLabel = t(`team.weekday.${weekday}`);
            const dayErrors = errors[weekday];

            return (
              <div key={weekday} className="rounded-md border border-border p-3">
                <Select
                  label={dayLabel}
                  value={day.worked ? "worked" : "rest"}
                  onChange={(event) =>
                    setValues((current) => updateDay(current, weekday, { worked: event.target.value === "worked" }))
                  }
                  options={[
                    { value: "rest", label: t("teamDetail.schedule.form.rest") },
                    { value: "worked", label: t("teamDetail.schedule.form.worked") },
                  ]}
                />

                {day.worked && (
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          aria-label={t("teamDetail.schedule.form.startLabelForSlot", { day: dayLabel, slot: 1 })}
                          value={day.interval1Start}
                          onChange={(event) => setValues((current) => updateDay(current, weekday, { interval1Start: event.target.value }))}
                        />
                        <span aria-hidden="true">–</span>
                        <Input
                          type="time"
                          aria-label={t("teamDetail.schedule.form.endLabelForSlot", { day: dayLabel, slot: 1 })}
                          value={day.interval1End}
                          onChange={(event) => setValues((current) => updateDay(current, weekday, { interval1End: event.target.value }))}
                        />
                      </div>
                      {dayErrors?.interval1 && <p className="text-sm text-danger">{dayErrors.interval1}</p>}
                    </div>

                    {day.hasSecondInterval ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            aria-label={t("teamDetail.schedule.form.startLabelForSlot", { day: dayLabel, slot: 2 })}
                            value={day.interval2Start}
                            onChange={(event) =>
                              setValues((current) => updateDay(current, weekday, { interval2Start: event.target.value }))
                            }
                          />
                          <span aria-hidden="true">–</span>
                          <Input
                            type="time"
                            aria-label={t("teamDetail.schedule.form.endLabelForSlot", { day: dayLabel, slot: 2 })}
                            value={day.interval2End}
                            onChange={(event) =>
                              setValues((current) => updateDay(current, weekday, { interval2End: event.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="text-sm font-medium text-text-secondary hover:text-text hover:underline"
                            onClick={() =>
                              setValues((current) =>
                                updateDay(current, weekday, { hasSecondInterval: false, interval2Start: "", interval2End: "" }),
                              )
                            }
                          >
                            {t("teamDetail.schedule.form.removeInterval")}
                          </button>
                        </div>
                        {dayErrors?.interval2 && <p className="text-sm text-danger">{dayErrors.interval2}</p>}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="self-start"
                        onClick={() => setValues((current) => updateDay(current, weekday, { hasSecondInterval: true }))}
                      >
                        {t("teamDetail.schedule.form.addInterval")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("team.form.cancel")}
          </Button>
          <Button type="submit">{t("team.form.submitEdit")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
