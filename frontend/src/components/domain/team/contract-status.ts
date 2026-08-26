import type { StatusTone } from "@/components/ui/status-badge";
import type { ContractStatus } from "./types";

interface ContractStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central contract status -> tone/label registry (UI-007B §15), mirroring `cash-session-status.ts`'s pattern. */
export const CONTRACT_STATUS_MAP: Record<ContractStatus, ContractStatusMeta> = {
  active: { tone: "success", translationKey: "team.contractStatus.active" },
  ended: { tone: "neutral", translationKey: "team.contractStatus.ended" },
};
