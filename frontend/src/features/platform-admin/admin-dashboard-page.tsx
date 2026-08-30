"use client";

import Link from "next/link";
import { AlertTriangle, Ban, Hourglass, ShieldOff, type LucideIcon } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { AttentionItem } from "@/components/ui/attention-item";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getTenantsMockData } from "./mock-tenants-data";
import { getPlatformSubscriptionsMockData } from "./mock-platform-subscriptions-data";
import { getPlatformUsersMockData } from "./mock-platform-users-data";
import { getPlatformAuditEventsMockData } from "./mock-platform-audit-data";
import { computeTenantKpis } from "./tenants";
import { computeSubscriptionKpis } from "./subscriptions";
import { computePlatformUserKpis } from "./platform-users";
import { computeAttentionItems } from "./attention";
import { getAuditActionLabelKey, sortPlatformAuditEventsDescending } from "./audit";

const ATTENTION_ICONS: Record<string, LucideIcon> = {
  "attn-expired": Ban,
  "attn-grace": Hourglass,
  "attn-blackout": ShieldOff,
  "attn-suspended": AlertTriangle,
};

const RECENT_ACTIVITY_LIMIT = 5;

/**
 * Platform dashboard (UI-013ABCDE Gate 1 §08/§09/§10, wireframe Screen 54).
 * Every figure traces to a pure derivation over the same `Tenant[]`/
 * `Subscription[]`/`PlatformUser[]`/`PlatformAuditEvent[]` arrays the
 * Cabinets/Abonnements/Utilisateurs/Activité pages themselves read — never
 * an independently authored dashboard-only number (task Gate 1 §09,
 * "Implement derived platform KPIs"). No clinical data anywhere on this
 * screen (Spec #7 §32: "Do not expose clinical content by default").
 */
export function AdminDashboardPage() {
  const { t } = useLocale();

  const tenants = getTenantsMockData();
  const subscriptions = getPlatformSubscriptionsMockData();
  const users = getPlatformUsersMockData();
  const auditEvents = getPlatformAuditEventsMockData();

  const tenantKpis = computeTenantKpis(tenants, subscriptions);
  const subscriptionKpis = computeSubscriptionKpis(subscriptions, MOCK_BUSINESS_DATE);
  const userKpis = computePlatformUserKpis(users);
  const attentionItems = computeAttentionItems(tenants, subscriptions);
  const recentEvents = sortPlatformAuditEventsDescending(auditEvents).slice(0, RECENT_ACTIVITY_LIMIT);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("admin.dashboard.pageTitle")} description={t("admin.dashboard.pageDescription")} />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t("admin.dashboard.tenantsSection")}</h2>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label={t("admin.dashboard.tenants.active")} value={tenantKpis.activeCount} emphasis="success" />
          <MetricCard label={t("admin.dashboard.tenants.trial")} value={tenantKpis.trialCount} emphasis="primary" />
          <MetricCard
            label={t("admin.dashboard.tenants.restricted")}
            value={tenantKpis.restrictedCount}
            emphasis={tenantKpis.restrictedCount > 0 ? "danger" : "neutral"}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t("admin.dashboard.subscriptionsSection")}</h2>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label={t("admin.dashboard.subscriptions.active")} value={subscriptionKpis.activeCount} emphasis="success" />
          <MetricCard
            label={t("admin.dashboard.subscriptions.expiringSoon")}
            value={subscriptionKpis.expiringSoonCount}
            emphasis={subscriptionKpis.expiringSoonCount > 0 ? "warning" : "neutral"}
          />
          <MetricCard
            label={t("admin.dashboard.subscriptions.expired")}
            value={subscriptionKpis.expiredCount}
            emphasis={subscriptionKpis.expiredCount > 0 ? "danger" : "neutral"}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t("admin.dashboard.usersSection")}</h2>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard label={t("admin.dashboard.users.total")} value={userKpis.totalCount} />
          <MetricCard label={t("admin.dashboard.users.active")} value={userKpis.activeCount} emphasis="success" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t("admin.dashboard.attentionTitle")}</h2>
          {attentionItems.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">{t("admin.dashboard.attentionEmpty")}</p>
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

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t("admin.dashboard.recentActivityTitle")}</h2>
            <Link href="/admin/activity" className="text-sm font-medium text-primary hover:underline">
              {t("admin.dashboard.viewAllActivity")}
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">{t("admin.dashboard.activityEmpty")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {recentEvents.map((event) => (
                <li key={event.id} className="py-2 text-sm text-text">
                  <p>{t(getAuditActionLabelKey(event.actionCode))}</p>
                  <p className="text-xs text-text-muted">{event.occurredAt}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
