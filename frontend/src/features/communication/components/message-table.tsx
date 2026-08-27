"use client";

import { useLocale } from "@/i18n/locale-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { COMMUNICATION_CHANNEL_MAP } from "@/components/domain/communication/channel";
import { COMMUNICATION_STATUS_MAP } from "@/components/domain/communication/message-status";
import { COMMUNICATION_PURPOSE_MAP } from "@/components/domain/communication/purpose";
import { formatDayMonth, getPatientFullName } from "@/features/communication/format";
import type { MessageRow } from "@/features/communication/messages";

export interface MessageTableProps {
  rows: MessageRow[];
  onSelect: (row: MessageRow) => void;
}

/** Desktop table (Spec #9 Screen 41: Patient | Type | Canal | Date | Statut) — mirrors `ItemTable`'s dual-render convention (paired with `MessageCardList` for mobile). Every row opens the read-only detail drawer — no navigation. */
export function MessageTable({ rows, onSelect }: MessageTableProps) {
  const { t, locale } = useLocale();

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
            <th className="px-4 py-3 text-start">{t("communication.messages.table.patient")}</th>
            <th className="px-4 py-3 text-start">{t("communication.messages.table.type")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("communication.messages.table.channel")}</th>
            <th className="px-4 py-3 text-start">{t("communication.messages.table.date")}</th>
            <th className="px-4 py-3 text-start">{t("communication.messages.table.status")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const channelMeta = COMMUNICATION_CHANNEL_MAP[row.message.channel];
            const statusMeta = COMMUNICATION_STATUS_MAP[row.message.status];
            const purposeMeta = COMMUNICATION_PURPOSE_MAP[row.message.purpose];
            const ChannelIcon = channelMeta.icon;

            return (
              <tr key={row.message.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onSelect(row)} className="font-medium text-primary hover:underline">
                    {row.patient ? getPatientFullName(row.patient) : row.message.recipient}
                  </button>
                  {row.patient && (
                    <p className="text-xs text-text-muted" dir="ltr">
                      {row.patient.patientNumber}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">{t(purposeMeta.translationKey)}</td>
                <td className="hidden px-4 py-3 text-text-secondary lg:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <ChannelIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t(channelMeta.translationKey)}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary" dir="ltr">
                  {formatDayMonth(row.message.createdAt.slice(0, 10), locale)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
