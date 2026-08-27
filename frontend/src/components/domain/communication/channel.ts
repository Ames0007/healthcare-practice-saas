import { MessageCircle, Smartphone, type LucideIcon } from "lucide-react";
import type { CommunicationChannel } from "./types";

interface CommunicationChannelMeta {
  translationKey: string;
  icon: LucideIcon;
}

/**
 * Central channel → label/icon registry (UI-009ABC §9). Icon only, no
 * per-channel color — UI-009ABC §9 explicitly says not to assign arbitrary
 * rainbow colors; channel identity is conveyed by icon + label text, tone
 * (color) stays reserved for `CommunicationMessageStatus` (§11).
 */
export const COMMUNICATION_CHANNEL_MAP: Record<CommunicationChannel, CommunicationChannelMeta> = {
  whatsapp: { translationKey: "communication.channel.whatsapp", icon: MessageCircle },
  sms: { translationKey: "communication.channel.sms", icon: Smartphone },
};

export const COMMUNICATION_CHANNEL_ORDER: CommunicationChannel[] = ["whatsapp", "sms"];
