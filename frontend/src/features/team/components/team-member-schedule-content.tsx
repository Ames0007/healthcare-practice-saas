"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import type { WorkInterval, WorkWeekFormValues } from "@/components/domain/team/types";
import {
  WEEKDAY_ORDER,
  buildInitialWorkWeekFormValues,
  buildIntervalsFromWorkWeekFormValues,
  computeWeeklyScheduledHours,
  groupIntervalsByWeekday,
} from "@/features/team/schedule";
import { WorkScheduleFormDialog } from "./work-schedule-form-dialog";

export interface TeamMemberScheduleContentProps {
  teamMemberId: string;
  intervals: WorkInterval[];
  onIntervalsChange: (intervals: WorkInterval[]) => void;
}

/**
 * The "Planning" tab (UI-007B §6-7) — the expected weekly work pattern
 * (PLANNING), never actual attendance (PRESENCE — UI-007C's own future
 * scope, explicitly out of bounds here). A day with no intervals reads
 * "Repos" (rest day) rather than an empty cell; a day with two intervals
 * (e.g. a lunch-break split shift) shows both, comma-separated.
 */
export function TeamMemberScheduleContent({ teamMemberId, intervals, onIntervalsChange }: TeamMemberScheduleContentProps) {
  const { t } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const grouped = groupIntervalsByWeekday(intervals);
  const weeklyHours = computeWeeklyScheduledHours(intervals);

  function openEditForm() {
    setFormOpen(true);
    setFormKey((key) => key + 1);
  }

  function handleFormSubmit(values: WorkWeekFormValues) {
    onIntervalsChange(buildIntervalsFromWorkWeekFormValues(teamMemberId, values));
    setFormOpen(false);
    setToastMessage(t("teamDetail.schedule.toast.updated"));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("teamDetail.schedule.title")}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t("teamDetail.schedule.weeklyTotal", { hours: weeklyHours })}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={openEditForm}>
            {t("teamDetail.edit")}
          </Button>
        </div>

        <dl className="mt-4 flex flex-col divide-y divide-border">
          {WEEKDAY_ORDER.map((weekday) => {
            const dayIntervals = grouped[weekday];
            return (
              <div key={weekday} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-sm font-medium text-text">{t(`team.weekday.${weekday}`)}</dt>
                <dd className="text-sm text-text-secondary" dir="ltr">
                  {dayIntervals.length === 0
                    ? t("teamDetail.schedule.rest")
                    : dayIntervals.map((interval) => `${interval.startTime}–${interval.endTime}`).join(", ")}
                </dd>
              </div>
            );
          })}
        </dl>
      </Card>

      <WorkScheduleFormDialog
        key={formKey}
        open={formOpen}
        initialValues={buildInitialWorkWeekFormValues(intervals)}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
