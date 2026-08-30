"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidWorkingHoursForm, type CabinetWorkingHoursFormValues } from "@/features/parametres/working-hours";
import { WEEKDAY_ORDER } from "@/features/team/schedule";

export interface OnboardingHoursStepProps {
  values: CabinetWorkingHoursFormValues;
  onChange: (values: CabinetWorkingHoursFormValues) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Step 2 — Horaires (task §20, Spec #9 Screen 05). Reuses
 * `isValidWorkingHoursForm` (which itself reuses `isValidWorkInterval`,
 * Équipe's own rule) — the identical start&lt;end/closed-day validation
 * `WorkingHoursPage` enforces, never a second time-validity check (task
 * §32). No calendar-exception/holiday capture here — that stays an
 * ongoing Paramètres → Horaires → Calendrier concern, never required
 * during first-run setup (task §21).
 */
export function OnboardingHoursStep({ values, onChange, onContinue, onBack }: OnboardingHoursStepProps) {
  const { t } = useLocale();
  const [showValidityError, setShowValidityError] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidWorkingHoursForm(values)) {
      setShowValidityError(true);
      return;
    }
    onContinue();
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-text">{t("onboarding.hours.heading")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t("onboarding.hours.description")}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        {WEEKDAY_ORDER.map((weekday) => {
          const day = values[weekday];
          return (
            <div key={weekday} className="flex flex-wrap items-end gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
              <label className="flex w-32 items-center gap-2 text-sm font-medium text-text">
                <input
                  type="checkbox"
                  checked={day.isOpen}
                  onChange={(event) => onChange({ ...values, [weekday]: { ...values[weekday], isOpen: event.target.checked } })}
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
                    onChange={(event) => onChange({ ...values, [weekday]: { ...values[weekday], startTime: event.target.value } })}
                  />
                  <Input
                    label={t("parametres.horaires.endLabel")}
                    type="time"
                    value={day.endTime}
                    onChange={(event) => onChange({ ...values, [weekday]: { ...values[weekday], endTime: event.target.value } })}
                  />
                </>
              ) : (
                <span className="text-sm text-text-muted">{t("parametres.horaires.closed")}</span>
              )}
            </div>
          );
        })}

        {showValidityError && <p className="text-sm text-danger">{t("parametres.horaires.invalidError")}</p>}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            {t("onboarding.nav.back")}
          </Button>
          <Button type="submit">{t("onboarding.nav.continue")}</Button>
        </div>
      </form>
    </Card>
  );
}
