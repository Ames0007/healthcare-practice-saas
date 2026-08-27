"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CabinetService } from "@/components/domain/settings/types";
import { formatMad } from "@/features/rapports/format";

export interface ServiceTableProps {
  services: CabinetService[];
  onEdit: (service: CabinetService) => void;
}

/** Services & tarifs list (Spec #9 Screen 45's own table: "Service / Prix / Durée / Mode RDV / Actif"). */
export function ServiceTable({ services, onEdit }: ServiceTableProps) {
  const { t, locale } = useLocale();

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="px-4 py-3 font-medium">{t("parametres.services.table.service")}</th>
            <th className="px-4 py-3 font-medium">{t("parametres.services.table.price")}</th>
            <th className="px-4 py-3 font-medium">{t("parametres.services.table.duration")}</th>
            <th className="px-4 py-3 font-medium">{t("parametres.services.table.schedulingMode")}</th>
            <th className="px-4 py-3 font-medium">{t("parametres.services.table.active")}</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">{t("parametres.services.table.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-text">{service.name}</td>
              <td className="px-4 py-3 tabular-nums">{formatMad(service.price, locale)}</td>
              <td className="px-4 py-3 tabular-nums">{t("parametres.services.durationValue", { minutes: service.durationMinutes })}</td>
              <td className="px-4 py-3">{t(`parametres.services.schedulingMode.${service.schedulingMode}`)}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={service.active ? "success" : "neutral"}>
                  {t(service.active ? "parametres.services.activeYes" : "parametres.services.activeNo")}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-end">
                <Button size="sm" variant="outline" onClick={() => onEdit(service)}>
                  {t("parametres.services.editAction")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
