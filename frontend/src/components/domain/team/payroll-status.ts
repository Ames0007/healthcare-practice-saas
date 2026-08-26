import type { StatusTone } from "@/components/ui/status-badge";
import type { PayrollEntryStatus, PayrollPeriodStatus } from "./types";

interface StatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central payroll-entry payment-status -> tone/label registry (UI-007CDEF §39/§47), mirroring `cash-session-status.ts`'s pattern. */
export const PAYROLL_ENTRY_STATUS_MAP: Record<PayrollEntryStatus, StatusMeta> = {
  unpaid: { tone: "warning", translationKey: "team.payrollEntryStatus.unpaid" },
  paid: { tone: "success", translationKey: "team.payrollEntryStatus.paid" },
};

/** Central payroll-period status -> tone/label registry (UI-007CDEF §38/§50) — governs read-only immutability, distinct from `PayrollEntryStatus`. */
export const PAYROLL_PERIOD_STATUS_MAP: Record<PayrollPeriodStatus, StatusMeta> = {
  draft: { tone: "info", translationKey: "team.payrollPeriodStatus.draft" },
  finalized: { tone: "neutral", translationKey: "team.payrollPeriodStatus.finalized" },
};
