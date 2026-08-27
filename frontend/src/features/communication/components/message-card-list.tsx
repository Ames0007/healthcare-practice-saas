"use client";

import { useLocale } from "@/i18n/locale-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonClassNames } from "@/components/ui/button";
import { COMMUNICATION_CHANNEL_MAP } from "@/components/domain/communication/channel";
import { COMMUNICATION_STATUS_MAP } from "@/components/domain/communication/message-status";
import { COMMUNICATION_PURPOSE_MAP } from "@/components/domain/communication/purpose";
import { formatDayMonth, getPatientFullName } from "@/features/communication/format";
import type { MessageRow } from "@/features/communication/messages";

export interface MessageCardListProps {
  rows: MessageRow[];
  onSelect: (row: MessageRow) => void;
}

/** Mobile compact cards, mirrors `ItemCardList`'s exact `divide-y ... md:hidden` convention. */
export function MessageCardList({ rows, onSelect }: MessageCardListProps) {
  const { t, locale } = useLocale();

  return (
    <div className="flex flex-col divide-y divide-border md:hidden">
      {rows.map((row) => {
        const channelMeta = COMMUNICATION_CHANNEL_MAP[row.message.channel];
        const statusMeta = COMMUNICATION_STATUS_MAP[row.message.status];
        const purposeMeta = COMMUNICATION_PURPOSE_MAP[row.message.purpose];
        const ChannelIcon = channelMeta.icon;

        return (
          <div key={row.message.id} className="flex flex-col gap-2 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-text">{row.patient ? getPatientFullName(row.patient) : row.message.recipient}</p>
              <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
            </div>

            <p className="text-xs text-text-muted">{t(purposeMeta.translationKey)}</p>

            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <ChannelIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t(channelMeta.translationKey)}
              </span>
              <span dir="ltr">{formatDayMonth(row.message.createdAt.slice(0, 10), locale)}</span>
            </div>

            <button type="button" onClick={() => onSelect(row)} className={buttonClassNames("outline", "sm", "w-fit")}>
              {t("communication.messages.view")}
            </button>
          </div>
        );
      })}
    </div>
  );
}
