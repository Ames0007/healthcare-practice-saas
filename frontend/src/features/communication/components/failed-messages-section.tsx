"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COMMUNICATION_CHANNEL_MAP } from "@/components/domain/communication/channel";
import { COMMUNICATION_PURPOSE_MAP } from "@/components/domain/communication/purpose";
import { formatDayMonth, getPatientFullName } from "@/features/communication/format";
import type { MessageRow } from "@/features/communication/messages";

export interface FailedMessagesSectionProps {
  rows: MessageRow[];
  onRetry: (row: MessageRow) => void;
}

/** Failed-message operational attention (UI-009ABC §14), with an inline, now-operational Retry action (§16) — mirrors `AttentionItemsSection`'s compact-list pattern. */
export function FailedMessagesSection({ rows, onRetry }: FailedMessagesSectionProps) {
  const { t, locale } = useLocale();

  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("communication.dashboard.failedSection.title")}</h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">{t("communication.dashboard.failedSection.empty")}</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {rows.map((row) => {
            const channelMeta = COMMUNICATION_CHANNEL_MAP[row.message.channel];
            const purposeMeta = COMMUNICATION_PURPOSE_MAP[row.message.purpose];
            const ChannelIcon = channelMeta.icon;

            return (
              <li key={row.message.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  {row.patient ? (
                    <Link href={`/app/patients/${row.patient.id}`} className="font-medium text-primary hover:underline">
                      {getPatientFullName(row.patient)}
                    </Link>
                  ) : (
                    <p className="font-medium text-text">{row.message.recipient}</p>
                  )}
                  <p className="text-xs text-text-muted">
                    {t(purposeMeta.translationKey)} ·{" "}
                    <span className="inline-flex items-center gap-1">
                      <ChannelIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {t(channelMeta.translationKey)}
                    </span>{" "}
                    · <span dir="ltr">{formatDayMonth(row.message.createdAt.slice(0, 10), locale)}</span>
                  </p>
                  {row.message.failureReason && <p className="text-xs text-danger">{row.message.failureReason}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => onRetry(row)}>
                  {t("communication.dashboard.failedSection.retry")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
