"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { MOCK_NOW_TIME } from "@/features/agenda/mock-data";
import type { CommunicationMessage, MessageTemplate } from "@/components/domain/communication/types";
import type { Patient } from "@/features/patients/types";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { Invoice } from "@/components/domain/finance/types";
import { getCommunicationMessagesMockData } from "./mock-messages-data";
import { getMessageTemplatesMockData } from "./mock-templates-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getAgendaMockAppointments } from "@/features/agenda/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { computeCommunicationKpis, getFailedMessageRows, getQueuedMessageRows } from "./dashboard";
import { buildInitialSendMessageFormValues, buildSentMessage, generateNextMessageId, retryMessage, type SendMessageFormValues } from "./operations";
import { CommunicationNav } from "./components/communication-nav";
import { CommunicationKpiSummary } from "./components/communication-kpi-summary";
import { FailedMessagesSection } from "./components/failed-messages-section";
import { PendingMessagesSection } from "./components/pending-messages-section";
import { SendMessageDialog } from "./components/send-message-dialog";
import type { MessageRow } from "./messages";

export type CommunicationDashboardState = "loading" | "loaded" | "error";

export interface CommunicationDashboardProps {
  messages?: CommunicationMessage[];
  templates?: MessageTemplate[];
  patients?: Patient[];
  appointments?: AgendaAppointment[];
  invoices?: Invoice[];
  state?: CommunicationDashboardState;
  onRetry?: () => void;
}

const NEW_MESSAGE_TIMESTAMP = `${MOCK_BUSINESS_DATE}T${MOCK_NOW_TIME}:00`;

/**
 * Communication dashboard (UI-009ABC Gate 3, `/app/communication`) — KPIs,
 * failed/queued operational attention, and the bounded Send Message /
 * Retry prototypes. Replaces the last remaining Communication placeholder
 * route. Local page state only, no persistence (mirrors every other
 * prototype interaction in this codebase).
 */
export function CommunicationDashboard({
  messages: providedMessages,
  templates: providedTemplates,
  patients: providedPatients,
  appointments: providedAppointments,
  invoices: providedInvoices,
  state = "loaded",
  onRetry,
}: CommunicationDashboardProps) {
  const { t } = useLocale();
  const [overrideMessages, setOverrideMessages] = useState<CommunicationMessage[] | null>(null);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("communication.dashboard.pageTitle")} description={t("communication.dashboard.pageDescription")} />
        <CommunicationNav />
        <div className="animate-pulse rounded-lg border border-border bg-surface-subtle" style={{ height: 320 }} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("communication.dashboard.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("communication.dashboard.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const seedMessages = providedMessages ?? getCommunicationMessagesMockData();
  const messages = overrideMessages ?? seedMessages;
  const templates = providedTemplates ?? getMessageTemplatesMockData();
  const patients = providedPatients ?? getPatientsMockData();
  const appointments = providedAppointments ?? getAgendaMockAppointments();
  const invoices = providedInvoices ?? getInvoicesMockData();

  const kpis = computeCommunicationKpis(messages, MOCK_BUSINESS_DATE);
  const failedRows = getFailedMessageRows(messages, patients, appointments, invoices);
  const queuedRows = getQueuedMessageRows(messages, patients, appointments, invoices);

  function handleRetry(row: MessageRow) {
    setOverrideMessages(retryMessage(messages, row.message.id, MOCK_BUSINESS_DATE));
  }

  function handleSendSubmit(values: SendMessageFormValues) {
    const patient = patients.find((candidate) => candidate.id === values.patientId);
    if (!patient) {
      return;
    }
    const template = templates.find((candidate) => candidate.id === values.templateId) ?? null;
    const created = buildSentMessage(values, patient, generateNextMessageId(messages), NEW_MESSAGE_TIMESTAMP, template);
    setOverrideMessages([...messages, created]);
    setIsSendDialogOpen(false);
  }

  const sendButton = (
    <Button size="sm" onClick={() => setIsSendDialogOpen(true)}>
      {t("communication.dashboard.sendButton")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("communication.dashboard.pageTitle")} description={t("communication.dashboard.pageDescription")} primaryAction={sendButton} />

      <CommunicationNav />

      <CommunicationKpiSummary kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FailedMessagesSection rows={failedRows} onRetry={handleRetry} />
        <PendingMessagesSection rows={queuedRows} />
      </div>

      <SendMessageDialog
        open={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        onSubmit={handleSendSubmit}
        initialValues={buildInitialSendMessageFormValues()}
        patients={patients}
        templates={templates}
        cabinetName={t("topbar.practiceName")}
      />
    </div>
  );
}
