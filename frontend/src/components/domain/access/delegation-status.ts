import type { StatusTone } from "@/components/ui/status-badge";
import type { DelegationStatus } from "./types";

interface DelegationStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Centralized status -> tone/label registry (UI-011X Gate 3), mirroring `SUBSCRIPTION_STATUS_MAP`'s exact pattern. */
export const DELEGATION_STATUS_MAP: Record<DelegationStatus, DelegationStatusMeta> = {
  scheduled: { tone: "info", translationKey: "access.delegations.status.scheduled" },
  active: { tone: "success", translationKey: "access.delegations.status.active" },
  expired: { tone: "neutral", translationKey: "access.delegations.status.expired" },
  revoked: { tone: "danger", translationKey: "access.delegations.status.revoked" },
};

/** Deterministic iteration order — scheduled precedes active which precedes the two ended states. */
export const DELEGATION_STATUS_ORDER: DelegationStatus[] = ["scheduled", "active", "expired", "revoked"];
