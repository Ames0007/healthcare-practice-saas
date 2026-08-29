"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { SchedulablePractitioner } from "../types";

export interface PractitionerStepProps {
  practitioners: SchedulablePractitioner[];
  onSelect: (practitioner: SchedulablePractitioner) => void;
  onBack: () => void;
}

/** Task §30/§32 — canonical schedulable-practitioner identity only (never `role === "practitioner"` alone). */
export function PractitionerStep({ practitioners, onSelect, onBack }: PractitionerStepProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-primary hover:underline">
        {t("booking.backAction")}
      </button>
      <h2 className="text-lg font-semibold text-text">{t("booking.practitioner.heading")}</h2>

      {practitioners.length === 0 ? (
        <EmptyState
          title={t("booking.practitioner.empty")}
          primaryAction={
            <Button type="button" variant="outline" onClick={onBack}>
              {t("booking.practitioner.changeService")}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {practitioners.map((practitioner) => (
            <button key={practitioner.practitionerId} type="button" onClick={() => onSelect(practitioner)} className="text-start">
              <Card className="transition-colors duration-150 hover:border-primary">
                <p className="text-sm font-medium text-text">{practitioner.name}</p>
                {practitioner.professionalTitle && <p className="text-xs text-text-muted">{practitioner.professionalTitle}</p>}
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
