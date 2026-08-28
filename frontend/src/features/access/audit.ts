import type { AccessAuditEvent } from "@/components/domain/access/types";
import { getPermissionDefinition } from "@/components/domain/access/permission-catalog";

/**
 * Resolves an audit event's `detail` string to a display label where
 * possible — a permission key becomes its own catalog label; a role or
 * delegation id is shown as-is (still readable, e.g. "role-receptionist"/
 * "delegation-1") rather than requiring a full role/delegation lookup
 * this bounded prototype table does not need.
 */
export function resolveAuditDetailLabel(event: AccessAuditEvent, t: (key: string) => string): string {
  if (!event.detail) {
    return "—";
  }
  if (event.type === "permission_granted" || event.type === "permission_restricted") {
    const permission = getPermissionDefinition(event.detail);
    return permission ? t(permission.labelKey) : event.detail;
  }
  return event.detail;
}

/** Most recent first — an audit trail reads newest-on-top. */
export function sortAuditEventsDescending(events: AccessAuditEvent[]): AccessAuditEvent[] {
  return [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
