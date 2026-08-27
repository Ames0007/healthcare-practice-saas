import type { MessageTemplate } from "@/components/domain/communication/types";
import { extractVariablesFromBody } from "./templates";

function template(input: Omit<MessageTemplate, "variables">): MessageTemplate {
  return { ...input, variables: extractVariablesFromBody(input.body) };
}

/**
 * Centralized synthetic template fixtures (UI-009ABC §23-29). At least
 * one template exists for every `CommunicationEventType` the automation
 * rules reference (`mock-automation-rules-data.ts`), plus an Arabic
 * template (tpl-3, reproducing Spec #9 Screen 42's own worked example —
 * "تذكير بالموعد" / WhatsApp / AR) and one deliberately inactive template
 * (tpl-8) to prove the active/inactive badge renders both states.
 */
export function getMessageTemplatesMockData(): MessageTemplate[] {
  return [
    template({
      id: "tpl-1",
      name: "Confirmation standard",
      purpose: "appointment_confirmation",
      channel: "whatsapp",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}, votre rendez-vous du {{appointment_date}} à {{appointment_time}} avec {{practitioner_name}} est confirmé. {{cabinet_name}}.",
      active: true,
      updatedAt: "2026-07-01",
    }),
    template({
      id: "tpl-2",
      name: "Rappel RDV — 24h avant",
      purpose: "appointment_reminder",
      channel: "whatsapp",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}, rappel de votre rendez-vous le {{appointment_date}} à {{appointment_time}} avec {{practitioner_name}}.",
      active: true,
      updatedAt: "2026-07-01",
    }),
    template({
      id: "tpl-3",
      name: "تذكير بالموعد",
      purpose: "appointment_reminder",
      channel: "whatsapp",
      locale: "ar",
      body: "مرحباً {{patient_first_name}}، تذكير بموعدكم يوم {{appointment_date}} على الساعة {{appointment_time}} مع {{practitioner_name}}.",
      active: true,
      updatedAt: "2026-07-01",
    }),
    template({
      id: "tpl-4",
      name: "Modification de créneau",
      purpose: "appointment_change",
      channel: "whatsapp",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}, votre rendez-vous a été modifié : nouveau créneau le {{appointment_date}} à {{appointment_time}}.",
      active: true,
      updatedAt: "2026-06-20",
    }),
    template({
      id: "tpl-5",
      name: "Annulation standard",
      purpose: "appointment_cancellation",
      channel: "sms",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}, votre rendez-vous du {{appointment_date}} a été annulé. Contactez-nous pour reprogrammer.",
      active: true,
      updatedAt: "2026-06-20",
    }),
    template({
      id: "tpl-6",
      name: "Accusé de paiement",
      purpose: "payment_confirmation",
      channel: "sms",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}, nous confirmons la réception de votre paiement de {{amount_due}}. Merci.",
      active: true,
      updatedAt: "2026-06-15",
    }),
    template({
      id: "tpl-7",
      name: "Rappel d'échéance à venir",
      purpose: "installment_reminder",
      channel: "whatsapp",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}, rappel : une échéance de {{amount_due}} est due le {{installment_due_date}}.",
      active: true,
      updatedAt: "2026-06-15",
    }),
    template({
      id: "tpl-8",
      name: "Relance impayé",
      purpose: "overdue_payment_reminder",
      channel: "sms",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}, votre facture {{invoice_number}} ({{remaining_balance}}) est en retard de paiement.",
      active: false,
      updatedAt: "2026-05-01",
    }),
    template({
      id: "tpl-9",
      name: "Suivi post-consultation",
      purpose: "follow_up",
      channel: "whatsapp",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}, merci pour votre visite du {{appointment_date}}. N'hésitez pas à nous contacter.",
      active: true,
      updatedAt: "2026-05-20",
    }),
    template({
      id: "tpl-10",
      name: "Info cabinet",
      purpose: "custom_operational",
      channel: "sms",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}, information du cabinet {{cabinet_name}}.",
      active: true,
      updatedAt: "2026-05-10",
    }),
  ];
}
