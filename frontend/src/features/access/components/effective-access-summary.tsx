"use client";

import { useLocale } from "@/i18n/locale-provider";
import type { EffectivePermissionEntry } from "@/components/domain/access/types";
import { getPermissionDefinition } from "@/components/domain/access/permission-catalog";

export interface EffectiveAccessSummaryProps {
  entries: EffectivePermissionEntry[];
}

/** Most specific/temporary source first — a delegation is more worth flagging at a glance than "comes from the role." */
function primarySourceKey(entry: EffectivePermissionEntry): "delegation" | "grant" | "role" {
  if (entry.sources.includes("delegation")) return "delegation";
  if (entry.sources.includes("grant")) return "grant";
  return "role";
}

/**
 * Effective-access explanation (UI-011X Gate 4, task §22) — a compact,
 * at-a-glance list of every permission this membership currently
 * effectively holds and which layer is responsible, sitting above the
 * full per-domain checklist in `UserAccessDrawer` (which already shows
 * the same `sources`/`restricted` facts inline, permission by permission
 * — this is the summary view of the same real data, never a second
 * computation).
 */
export function EffectiveAccessSummary({ entries }: EffectiveAccessSummaryProps) {
  const { t } = useLocale();
  const granted = entries.filter((entry) => entry.granted);

  return (
    <div className="rounded-md border border-border bg-surface-subtle p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {t("access.users.drawer.effectiveAccessTitle", { count: granted.length })}
      </h3>
      {granted.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">{t("access.users.drawer.effectiveAccessEmpty")}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {granted.map((entry) => {
            const permission = getPermissionDefinition(entry.permissionKey);
            if (!permission) return null;
            const source = primarySourceKey(entry);

            return (
              <li key={entry.permissionKey} className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-xs text-text">
                {t(permission.labelKey)}
                <span className="text-text-muted">{t(`access.users.drawer.source.${source}`)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
