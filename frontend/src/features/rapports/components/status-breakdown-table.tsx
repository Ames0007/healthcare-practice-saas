"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { APPOINTMENT_STATUS_MAP } from "@/components/domain/appointments/appointment-status";
import type { AppointmentStatusBreakdownRow } from "@/components/domain/reports/types";

export interface StatusBreakdownTableProps {
  rows: AppointmentStatusBreakdownRow[];
}

/**
 * Objective per-status counts for the selected period (Spec #2 §42.1's
 * "Confirmed, Completed, Cancelled" breakdown) — the bounded alternative to
 * an invented "confirmation rate" formula (see `ActivityReportKpis`'s own
 * doc comment). Reuses `APPOINTMENT_STATUS_MAP` for tone/label, never a
 * second status vocabulary.
 */
export function StatusBreakdownTable({ rows }: StatusBreakdownTableProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t("rapports.activity.statusBreakdown.title")}
      </h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-medium">{t("rapports.activity.statusBreakdown.status")}</th>
              <th className="px-4 py-3 font-medium">{t("rapports.activity.statusBreakdown.count")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const meta = APPOINTMENT_STATUS_MAP[row.status];
              return (
                <tr key={row.status} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <StatusBadge tone={meta.tone}>{t(meta.translationKey)}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
