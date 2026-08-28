import type { StatusTone } from "@/components/ui/status-badge";
import type { SubscriptionStatus } from "./types";

interface SubscriptionStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/**
 * Centralized status -> tone/label registry (UI-011ABC Gate 1), mirroring
 * `contract-status.ts`'s exact pattern. `trialing` is `info` (a neutral,
 * time-boxed state, not yet a commitment); `active` is `success`;
 * `expired`/`blackout` are `danger` (both mean operational access is or
 * is about to be blocked); `grace` is `warning` (Screen 48's own "grace"
 * banner is a warning, not yet a hard stop); `cancelled` is `neutral`
 * (an ended state, mirrors `CONTRACT_STATUS_MAP.ended`).
 */
export const SUBSCRIPTION_STATUS_MAP: Record<SubscriptionStatus, SubscriptionStatusMeta> = {
  trialing: { tone: "info", translationKey: "abonnement.status.trialing" },
  active: { tone: "success", translationKey: "abonnement.status.active" },
  expired: { tone: "danger", translationKey: "abonnement.status.expired" },
  grace: { tone: "warning", translationKey: "abonnement.status.grace" },
  blackout: { tone: "danger", translationKey: "abonnement.status.blackout" },
  cancelled: { tone: "neutral", translationKey: "abonnement.status.cancelled" },
};

/** Deterministic iteration order matching Spec #3 §3.6's own transition sequence (TRIALING -> ACTIVE -> EXPIRED -> GRACE -> BLACKOUT, CANCELLED reachable from either). */
export const SUBSCRIPTION_STATUS_ORDER: SubscriptionStatus[] = [
  "trialing",
  "active",
  "expired",
  "grace",
  "blackout",
  "cancelled",
];
