/**
 * Communication domain model (UI-009ABC, Spec #4 §24). Frontend prototype
 * only — no real WhatsApp/SMS provider, no queue, no webhook (UI-009ABC
 * hard constraints). Field names mirror `communication_messages` (Spec #4
 * §24.2) exactly where the spec defines one, so a later real integration
 * maps onto this shape without renaming.
 *
 * No `direction` field: Spec #4 §24.2's schema is entirely outbound
 * (recipient/resolved_body/template_id, no inbound conversation concept),
 * and UI-009ABC §10 explicitly says not to invent inbound WhatsApp
 * conversation management when V1 only requires outbound operational
 * communication. Every message in this domain is outbound by construction.
 */
export type CommunicationChannel = "whatsapp" | "sms";

/**
 * Matches Spec #4 §24.2's `status ENUM(queued, sent, delivered, failed)`
 * exactly — UI-009ABC §11 itself only offers "pending" as a hedged
 * "Potential" label and defers to "the approved workflow", which spec #4
 * names as `queued`.
 *
 * Semantics (UI-009ABC §12, prototype metadata only — no real provider
 * acknowledgment exists):
 * - queued: planned locally, not yet handed to a provider.
 * - sent: handed to the (synthetic) provider.
 * - delivered: delivery confirmed.
 * - failed: delivery failed (before or after being handed to the provider).
 */
export type CommunicationMessageStatus = "queued" | "sent" | "delivered" | "failed";

/**
 * Bounded message-purpose vocabulary — the union of Spec #2 §39.1's
 * template categories and Spec #4 §24.3's automation `event_type` examples.
 * Shared by `CommunicationMessage.purpose` (Gate 1, drives the history
 * table's "Type" column per Spec #9 Screen 41) and `MessageTemplate.purpose`
 * (Gate 2) so the two never drift into separate vocabularies.
 */
export type CommunicationPurpose =
  | "appointment_confirmation"
  | "appointment_reminder"
  | "appointment_change"
  | "appointment_cancellation"
  | "booking_request_response"
  | "payment_confirmation"
  | "installment_reminder"
  | "overdue_payment_reminder"
  | "follow_up"
  | "next_session_reminder"
  | "custom_operational";

/**
 * Spec #4 §24.2's `communication_messages` row, minus `tenant_id` (implicit
 * single-tenant prototype context) and `created_by` (no auth/session
 * concept here). `patientId`/`appointmentId`/`invoiceId` are soft
 * references resolved at render time by `features/communication/messages.ts`
 * against the existing Patient/AgendaAppointment/Invoice fixtures
 * (CLAUDE.md §12 — never duplicated).
 */
export interface CommunicationMessage {
  id: string;
  patientId?: string;
  appointmentId?: string;
  invoiceId?: string;
  /** Spec #4 §24.2's `installment_id NULL` — set only alongside `invoiceId`, for installment-specific reminders (CLAUDE.md §22: installments are separate records from their invoice). */
  installmentId?: string;
  channel: CommunicationChannel;
  purpose: CommunicationPurpose;
  /** Set only when the message was generated from a saved template (Gate 2) — spec allows `template_id NULL` for ad-hoc/custom sends. */
  templateId?: string;
  /** Phone number the message was addressed to — administrative field only, never a real patient's number (UI-009ABC §13). */
  recipient: string;
  /** The fully rendered message text actually sent — administrative content only, never clinical (UI-009ABC §14). */
  resolvedBody: string;
  status: CommunicationMessageStatus;
  /** Synthetic provider metadata only (UI-009ABC §8) — never a real provider identifier. */
  providerMessageId?: string;
  failureCode?: string;
  /** Required whenever `status === "failed"` (UI-009ABC §22). */
  failureReason?: string;
  scheduledAt?: string;
  /** Set once `status` is "sent", "delivered", or a post-send "failed" (never for "queued"). */
  sentAt?: string;
  /** Set only once `status === "delivered"`. */
  deliveredAt?: string;
  createdAt: string;
}

/** The SaaS supports FR/AR (CLAUDE.md §40) — a template's own language is independent of the current UI language (UI-009ABC §25). */
export type CommunicationLocale = "fr" | "ar";

/**
 * Strict variable allowlist (UI-009ABC §26, Spec #2 §39.2) — the union of
 * both lists so every spec-named variable is representable. No arbitrary
 * JavaScript/template expressions: only these tokens are ever substituted.
 */
export type CommunicationVariableKey =
  | "patient_first_name"
  | "patient_name"
  | "appointment_date"
  | "appointment_time"
  | "practitioner_name"
  | "cabinet_name"
  | "invoice_number"
  | "amount_due"
  | "remaining_balance"
  | "installment_due_date";

/** Spec #2 §39.2's template fields; `variables` is derived from `body` (never independently authored — see `extractVariablesFromBody`). */
export interface MessageTemplate {
  id: string;
  name: string;
  purpose: CommunicationPurpose;
  channel: CommunicationChannel;
  locale: CommunicationLocale;
  body: string;
  variables: CommunicationVariableKey[];
  active: boolean;
  updatedAt?: string;
}

/** Create/edit form model (UI-009ABC §29) — deliberately not the full future database entity, mirrors `PatientFormValues`'s own convention. */
export interface MessageTemplateFormValues {
  name: string;
  purpose: CommunicationPurpose;
  channel: CommunicationChannel;
  locale: CommunicationLocale;
  body: string;
}

/**
 * Spec #4 §24.3's `event_type` examples plus Spec #2 §40's full V1 rule
 * list (6 bullets) — one canonical event per bullet. `installment_due`
 * keeps the spec's own name (not "installment_reminder", which is already
 * a `CommunicationPurpose` value) to avoid the two bounded vocabularies
 * colliding on the same string with different meanings.
 */
export type CommunicationEventType =
  | "appointment_confirmed"
  | "appointment_reminder"
  | "appointment_modified"
  | "appointment_cancelled"
  | "payment_recorded"
  | "installment_due"
  | "installment_overdue";

/**
 * Spec #4 §24.3's `communication_automations` row, minus `tenant_id`
 * (implicit single-tenant prototype context). UI-009ABC §11's "bounded
 * configuration prototype": the owner toggles `active` on the fixed
 * canonical set of event types (Spec #2 §40's own closing line — "Owner
 * can configure whether each automation is active") — this is not a rule
 * builder that creates/deletes arbitrary event types (CLAUDE.md §3).
 */
export interface AutomationRule {
  id: string;
  eventType: CommunicationEventType;
  channel: CommunicationChannel;
  templateId: string;
  /** Spec #4 §24.3's `timing_offset_minutes NULL` — e.g. reminders sent X hours/days before an appointment. */
  timingOffsetMinutes?: number;
  active: boolean;
}
