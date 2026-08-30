import type { PlatformAuditEvent } from "@/components/domain/platform-admin/types";

/** Most recent first — an audit trail reads newest-on-top (mirrors `features/access/audit.ts`'s own `sortAuditEventsDescending`). */
export function sortPlatformAuditEventsDescending(events: PlatformAuditEvent[]): PlatformAuditEvent[] {
  return [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

/** Every `PlatformAuditActionCode` maps to a translation key — never rendered as a raw snake/dot-cased code (Gate 5 §27/§30). */
export function getAuditActionLabelKey(actionCode: PlatformAuditEvent["actionCode"]): string {
  return `admin.activity.audit.action.${actionCode.replace(/\./g, "_")}`;
}
