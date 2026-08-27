"use client";

import { Search } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CommunicationChannel, CommunicationMessageStatus } from "@/components/domain/communication/types";
import { COMMUNICATION_CHANNEL_MAP, COMMUNICATION_CHANNEL_ORDER } from "@/components/domain/communication/channel";
import { COMMUNICATION_STATUS_MAP, COMMUNICATION_STATUS_ORDER } from "@/components/domain/communication/message-status";

export type MessageChannelFilter = CommunicationChannel | "all";
export type MessageStatusFilter = CommunicationMessageStatus | "all";

export interface MessageFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  channelFilter: MessageChannelFilter;
  onChannelFilterChange: (value: MessageChannelFilter) => void;
  statusFilter: MessageStatusFilter;
  onStatusFilterChange: (value: MessageStatusFilter) => void;
  resultCount: number;
}

/** Search + Canal/Statut filters (Spec #9 Screen 41, UI-009ABC §15/§17) — mirrors `ItemFilters`'s exact layout. */
export function MessageFilters({
  search,
  onSearchChange,
  channelFilter,
  onChannelFilterChange,
  statusFilter,
  onStatusFilterChange,
  resultCount,
}: MessageFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <Input
          type="search"
          aria-label={t("communication.messages.searchLabel")}
          placeholder={t("communication.messages.searchLabel")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="ps-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label={t("communication.messages.channelFilterLabel")}
            value={channelFilter}
            onChange={(event) => onChannelFilterChange(event.target.value as MessageChannelFilter)}
            options={[
              { value: "all", label: t("communication.messages.channelFilterPlaceholder") },
              ...COMMUNICATION_CHANNEL_ORDER.map((channel) => ({ value: channel, label: t(COMMUNICATION_CHANNEL_MAP[channel].translationKey) })),
            ]}
          />
          <Select
            aria-label={t("communication.messages.statusFilterLabel")}
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as MessageStatusFilter)}
            options={[
              { value: "all", label: t("communication.messages.statusFilterPlaceholder") },
              ...COMMUNICATION_STATUS_ORDER.map((status) => ({ value: status, label: t(COMMUNICATION_STATUS_MAP[status].translationKey) })),
            ]}
          />
        </div>
        <p className="text-sm text-text-muted" aria-live="polite">
          {t("communication.messages.resultCount", { count: resultCount })}
        </p>
      </div>
    </div>
  );
}
