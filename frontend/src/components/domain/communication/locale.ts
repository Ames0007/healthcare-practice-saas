import type { CommunicationLocale } from "./types";

interface CommunicationLocaleMeta {
  translationKey: string;
}

export const COMMUNICATION_LOCALE_MAP: Record<CommunicationLocale, CommunicationLocaleMeta> = {
  fr: { translationKey: "communication.locale.fr" },
  ar: { translationKey: "communication.locale.ar" },
};

export const COMMUNICATION_LOCALE_ORDER: CommunicationLocale[] = ["fr", "ar"];
