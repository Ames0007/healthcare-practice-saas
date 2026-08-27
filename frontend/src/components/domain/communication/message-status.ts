import type { StatusTone } from "@/components/ui/status-badge";
import type { CommunicationMessageStatus } from "./types";

interface CommunicationStatusMeta {
  translationKey: string;
  tone: StatusTone;
}

/** Central status → label/tone registry (UI-009ABC §11), mirroring `STOCK_ATTENTION_STATUS_MAP`'s pattern. */
export const COMMUNICATION_STATUS_MAP: Record<CommunicationMessageStatus, CommunicationStatusMeta> = {
  queued: { translationKey: "communication.status.queued", tone: "neutral" },
  sent: { translationKey: "communication.status.sent", tone: "info" },
  delivered: { translationKey: "communication.status.delivered", tone: "success" },
  failed: { translationKey: "communication.status.failed", tone: "danger" },
};

export const COMMUNICATION_STATUS_ORDER: CommunicationMessageStatus[] = ["queued", "sent", "delivered", "failed"];
