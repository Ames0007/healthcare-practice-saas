import type { StatusTone } from "@/components/ui/status-badge";
import type { PermissionSensitivity } from "./types";

interface PermissionSensitivityMeta {
  tone: StatusTone;
  translationKey: string;
}

/**
 * UI-warning-only registry (task §7: "Sensitivity affects UI warning
 * only. It is NOT backend enforcement.") — mirrors every other status/
 * tone registry in this codebase (`SUBSCRIPTION_STATUS_MAP`,
 * `contract-status.ts`).
 */
export const PERMISSION_SENSITIVITY_MAP: Record<PermissionSensitivity, PermissionSensitivityMeta> = {
  normal: { tone: "neutral", translationKey: "access.sensitivity.normal" },
  sensitive: { tone: "warning", translationKey: "access.sensitivity.sensitive" },
  critical: { tone: "danger", translationKey: "access.sensitivity.critical" },
};
