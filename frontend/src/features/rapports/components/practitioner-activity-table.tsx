"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import type { PractitionerActivityRow } from "@/components/domain/reports/types";
import { formatMad } from "../format";

export interface PractitionerActivityTableProps {
  rows: PractitionerActivityRow[];
}

/** Per-practitioner activity + collections for the selected period (Spec #3 WF-72). */
export function PractitionerActivityTable({ rows }: PractitionerActivityTableProps) {
  const { t, locale } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t("rapports.activity.practitionerTable.title")}
      </h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-medium">{t("rapports.activity.practitionerTable.practitioner")}</th>
              <th className="px-4 py-3 font-medium">{t("rapports.activity.practitionerTable.appointments")}</th>
              <th className="px-4 py-3 font-medium">{t("rapports.activity.practitionerTable.completed")}</th>
              <th className="px-4 py-3 font-medium">{t("rapports.activity.practitionerTable.noShow")}</th>
              <th className="px-4 py-3 font-medium">{t("rapports.activity.practitionerTable.collected")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.practitionerId} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-text">{row.practitionerName}</td>
                <td className="px-4 py-3 tabular-nums">{row.appointmentsCount}</td>
                <td className="px-4 py-3 tabular-nums">{row.completedCount}</td>
                <td className="px-4 py-3 tabular-nums">{row.noShowCount}</td>
                <td className="px-4 py-3 tabular-nums">{formatMad(row.collectedAmount, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
