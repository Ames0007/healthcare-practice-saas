import type { CommunicationChannel, CommunicationMessage, CommunicationMessageStatus } from "@/components/domain/communication/types";

/**
 * Timestamp/failure-metadata coherence (UI-009ABC §22): "queued" carries
 * neither `sentAt` nor `deliveredAt`; "sent" carries `sentAt` but not
 * `deliveredAt`; "delivered" carries both, with `deliveredAt >= sentAt`;
 * "failed" always carries a non-empty `failureReason` (before or after
 * being handed to the provider, so `sentAt` is optional there).
 */
export function isValidMessageStatusSemantics(message: CommunicationMessage): boolean {
  switch (message.status) {
    case "queued":
      return !message.sentAt && !message.deliveredAt;
    case "sent":
      return !!message.sentAt && !message.deliveredAt;
    case "delivered":
      return !!message.sentAt && !!message.deliveredAt && message.deliveredAt >= message.sentAt;
    case "failed":
      return !!message.failureReason && message.failureReason.trim() !== "";
  }
}

export function matchesChannelFilter(message: CommunicationMessage, channel: CommunicationChannel | "all"): boolean {
  return channel === "all" || message.channel === channel;
}

export function matchesStatusFilter(message: CommunicationMessage, status: CommunicationMessageStatus | "all"): boolean {
  return status === "all" || message.status === status;
}

export function sortMessagesDesc(messages: CommunicationMessage[]): CommunicationMessage[] {
  return [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
