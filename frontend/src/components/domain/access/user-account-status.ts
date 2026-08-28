import type { StatusTone } from "@/components/ui/status-badge";
import type { UserAccountStatus } from "./types";

interface UserAccountStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Spec #4 §4.1 `users.status` ENUM, verbatim — all 4 values. */
export const USER_ACCOUNT_STATUS_MAP: Record<UserAccountStatus, UserAccountStatusMeta> = {
  invited: { tone: "info", translationKey: "access.users.status.invited" },
  active: { tone: "success", translationKey: "access.users.status.active" },
  disabled: { tone: "neutral", translationKey: "access.users.status.disabled" },
  locked: { tone: "danger", translationKey: "access.users.status.locked" },
};
