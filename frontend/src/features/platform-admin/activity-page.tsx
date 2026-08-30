"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Ban, Hourglass, ShieldOff, type LucideIcon } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { AttentionItem } from "@/components/ui/attention-item";
import { EmptyState } from "@/components/ui/empty-state";
import { getTenantsMockData } from "./mock-tenants-data";
import { getPlatformSubscriptionsMockData } from "./mock-platform-subscriptions-data";
import { getPlatformAuditEventsMockData } from "./mock-platform-audit-data";
import { computeAttentionItems } from "./attention";
import { getAuditActionLabelKey, sortPlatformAuditEventsDescending } from "./audit";

const ATTENTION_ICONS: Record<string, LucideIcon> = {
  "attn-expired": Ban,
  "attn-grace": Hourglass,
  "attn-blackout": ShieldOff,
  "attn-suspended": AlertTriangle,
};

/**
 * Platform audit/activity workspace (UI-013ABCDE Gate 5 §27/§29, Spec #4
 * §30.1). A dedicated "Support/tenant-context workspace" (task §28, Spec
 * #2 §55.6) is deliberately NOT built here — Spec #55.6 itself marks that
 * surface "Future/controlled," the same conditional-future framing Spec #1
 * §27 uses for impersonation; see `docs/implementation/DECISIONS.md` for
 * the recorded boundary. This page is read-only: bounded actions taken on
 * Tenant 360°/Users are session-local to those pages and never appear
 * here (`docs/implementation/RISKS_AND_BLOCKERS.md`).
 */
export function ActivityPage() {
  const { t } = useLocale();

  const tenants = useMemo(() => getTenantsMockData(), []);
  const subscriptions = useMemo(() => getPlatformSubscriptionsMockData(), []);
  const auditEvents = useMemo(() => getPlatformAuditEventsMockData(), []);

  const attentionItems = computeAttentionItems(tenants, subscriptions);
  const sortedEvents = sortPlatformAuditEventsDescending(auditEvents);
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("admin.activity.pageTitle")} description={t("admin.activity.pageDescription")} />

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t("admin.activity.attentionTitle")}</h2>
        {attentionItems.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">{t("admin.activity.attentionEmpty")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {attentionItems.map((item) => (
              <AttentionItem
                key={item.id}
                icon={ATTENTION_ICONS[item.id] ?? AlertTriangle}
                tone={item.tone}
                count={item.count}
                label={t(item.translationKey, { count: item.count })}
              />
            ))}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">{t("admin.activity.auditTitle")}</h2>
        {sortedEvents.length === 0 ? (
          <EmptyState title={t("admin.activity.auditEmpty")} />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="px-4 py-3 font-medium">{t("admin.activity.table.date")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.activity.table.action")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.activity.table.tenant")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.activity.table.reason")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((event) => (
                  <tr key={event.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text-secondary">{event.occurredAt}</td>
                    <td className="px-4 py-3 text-text">{t(getAuditActionLabelKey(event.actionCode))}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {event.tenantId ? (
                        <Link href={`/admin/tenants/${event.tenantId}`} className="text-primary hover:underline">
                          {tenantById.get(event.tenantId)?.name ?? event.tenantId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{event.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
