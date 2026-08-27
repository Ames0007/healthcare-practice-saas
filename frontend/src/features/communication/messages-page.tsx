"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { CommunicationMessage } from "@/components/domain/communication/types";
import type { Patient } from "@/features/patients/types";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { Invoice } from "@/components/domain/finance/types";
import { getCommunicationMessagesMockData } from "./mock-messages-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getAgendaMockAppointments } from "@/features/agenda/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { buildMessageRows, matchesMessageSearch, type MessageRow } from "./messages";
import { matchesChannelFilter, matchesStatusFilter, sortMessagesDesc } from "./communication";
import { retryMessage } from "./operations";
import { CommunicationNav } from "./components/communication-nav";
import { MessageFilters, type MessageChannelFilter, type MessageStatusFilter } from "./components/message-filters";
import { MessageTable } from "./components/message-table";
import { MessageCardList } from "./components/message-card-list";
import { MessageDetailDrawer } from "./components/message-detail-drawer";

export type MessagesPageState = "loading" | "loaded" | "error";

export interface MessagesPageProps {
  /** Prototype seams (mirrors Stock/Team), swap for real query results later. */
  messages?: CommunicationMessage[];
  patients?: Patient[];
  appointments?: AgendaAppointment[];
  invoices?: Invoice[];
  state?: MessagesPageState;
  onRetry?: () => void;
}

/**
 * Message history workspace (UI-009ABC Gate 1, `/app/communication/messages`)
 * — replaces the generic Communication placeholder. Every row resolves its
 * patient/appointment/invoice against the existing fixtures (never a
 * duplicate universe, CLAUDE.md §12); selecting a row opens the read-only
 * detail drawer (Spec #9 Screen 41).
 */
export function MessagesPage({ messages: providedMessages, patients: providedPatients, appointments: providedAppointments, invoices: providedInvoices, state = "loaded", onRetry }: MessagesPageProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<MessageChannelFilter>("all");
  const [statusFilter, setStatusFilter] = useState<MessageStatusFilter>("all");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [overrideMessages, setOverrideMessages] = useState<CommunicationMessage[] | null>(null);

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("communication.messages.pageTitle")} description={t("communication.messages.pageDescription")} />
        <CommunicationNav />
        <div className="animate-pulse rounded-lg border border-border bg-surface-subtle" style={{ height: 320 }} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("communication.messages.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("communication.messages.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const seedMessages = providedMessages ?? getCommunicationMessagesMockData();
  const messages = overrideMessages ?? seedMessages;
  const patients = providedPatients ?? getPatientsMockData();
  const appointments = providedAppointments ?? getAgendaMockAppointments();
  const invoices = providedInvoices ?? getInvoicesMockData();

  if (messages.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("communication.messages.pageTitle")} description={t("communication.messages.pageDescription")} />
        <CommunicationNav />
        <EmptyState title={t("communication.messages.emptyAllTitle")} description={t("communication.messages.emptyAllDescription")} />
      </div>
    );
  }

  const allRows = buildMessageRows(sortMessagesDesc(messages), patients, appointments, invoices);
  const searched = allRows.filter((row) => matchesMessageSearch(row, search));
  const channelFiltered = searched.filter((row) => matchesChannelFilter(row.message, channelFilter));
  const rows = channelFiltered.filter((row) => matchesStatusFilter(row.message, statusFilter));
  const selectedRow = allRows.find((row) => row.message.id === selectedMessageId) ?? null;

  function handleRetry(row: MessageRow) {
    setOverrideMessages(retryMessage(messages, row.message.id, MOCK_BUSINESS_DATE));
    setSelectedMessageId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("communication.messages.pageTitle")} description={t("communication.messages.pageDescription")} />

      <CommunicationNav />

      <MessageFilters
        search={search}
        onSearchChange={setSearch}
        channelFilter={channelFilter}
        onChannelFilterChange={setChannelFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        resultCount={rows.length}
      />

      {rows.length === 0 ? (
        search.trim() !== "" ? (
          <EmptyState
            title={t("communication.messages.searchEmptyTitle")}
            primaryAction={
              <Button size="sm" variant="outline" onClick={() => setSearch("")}>
                {t("communication.messages.clearSearch")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={t("communication.messages.filteredEmptyTitle")}
            primaryAction={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setChannelFilter("all");
                  setStatusFilter("all");
                }}
              >
                {t("communication.messages.clearFilters")}
              </Button>
            }
          />
        )
      ) : (
        <>
          <MessageTable rows={rows} onSelect={(row) => setSelectedMessageId(row.message.id)} />
          <MessageCardList rows={rows} onSelect={(row) => setSelectedMessageId(row.message.id)} />
        </>
      )}

      <MessageDetailDrawer row={selectedRow} open={selectedRow !== null} onClose={() => setSelectedMessageId(null)} onRetry={handleRetry} />
    </div>
  );
}
