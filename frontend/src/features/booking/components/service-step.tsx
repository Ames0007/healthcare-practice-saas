"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMad } from "@/features/today/format";
import type { CabinetService } from "@/components/domain/settings/types";

export interface ServiceStepProps {
  services: CabinetService[];
  onSelect: (service: CabinetService) => void;
}

/** Task §28/§29 — real, existing `CabinetService` fixtures only; never a second public price/duration catalog. */
export function ServiceStep({ services, onSelect }: ServiceStepProps) {
  const { t, locale } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text">{t("booking.service.heading")}</h2>

      {services.length === 0 ? (
        <EmptyState title={t("booking.service.empty")} />
      ) : (
        <div className="flex flex-col gap-2">
          {services.map((service) => (
            <button key={service.id} type="button" onClick={() => onSelect(service)} className="text-start">
              <Card className="transition-colors duration-150 hover:border-primary">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text">{service.name}</p>
                    <p className="text-xs text-text-muted">
                      {service.durationMinutes} {t("booking.minutesSuffix")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-text">{formatMad(service.price, locale)}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
