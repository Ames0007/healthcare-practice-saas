"use client";

import { TriangleAlert } from "lucide-react";

export interface EntitlementLimitNoticeProps {
  message: string;
}

/**
 * Reusable Feature/limit-lock presentation (UI-011ABC Gate 2, task §31,
 * WF-74: "Action blocked safely. UI explains limit."). Deliberately a
 * single generic component driven entirely by a translated `message`
 * prop — no per-feature variant, since this task establishes the
 * pattern once rather than retrofitting every screen (task's own
 * explicit boundary: "do not retrofit every existing application screen
 * in this task"). Icon + text, never color alone (Spec #7/#8 §7).
 */
export function EntitlementLimitNotice({ message }: EntitlementLimitNoticeProps) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
