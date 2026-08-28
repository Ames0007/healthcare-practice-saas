import type { StatusTone } from "@/components/ui/status-badge";
import type { ReferralStatus } from "./types";

interface ReferralStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/**
 * Centralized status -> tone/label registry (UI-011ABC Gate 3), mirroring
 * `SUBSCRIPTION_STATUS_MAP`/`contract-status.ts`'s exact pattern. `qualified`
 * is `success` (Screen 50's own "Validé" example); `paid_pending_validation`
 * is `warning` (in-progress, not yet a settled outcome); `attributed`/
 * `trial` are `info` (Screen 50's own "Essai"); `rejected`/`voided` are
 * `neutral` — an ended-without-reward outcome, not an error the referrer
 * caused (mirrors `CONTRACT_STATUS_MAP.ended`'s own neutral framing).
 */
export const REFERRAL_STATUS_MAP: Record<ReferralStatus, ReferralStatusMeta> = {
  attributed: { tone: "info", translationKey: "abonnement.parrainage.status.attributed" },
  trial: { tone: "info", translationKey: "abonnement.parrainage.status.trial" },
  paid_pending_validation: { tone: "warning", translationKey: "abonnement.parrainage.status.paid_pending_validation" },
  qualified: { tone: "success", translationKey: "abonnement.parrainage.status.qualified" },
  rejected: { tone: "neutral", translationKey: "abonnement.parrainage.status.rejected" },
  voided: { tone: "neutral", translationKey: "abonnement.parrainage.status.voided" },
};

/** Deterministic iteration order matching Spec #3 WF-58/WF-59's own qualification-flow sequence. */
export const REFERRAL_STATUS_ORDER: ReferralStatus[] = [
  "attributed",
  "trial",
  "paid_pending_validation",
  "qualified",
  "rejected",
  "voided",
];
