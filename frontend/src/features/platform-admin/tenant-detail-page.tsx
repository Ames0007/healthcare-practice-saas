"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { TENANT_STATUS_MAP } from "@/components/domain/platform-admin/tenant-status";
import { SUBSCRIPTION_STATUS_MAP } from "@/components/domain/subscription/subscription-status";
import { CABINET_SPECIALTY_MAP } from "@/components/domain/settings/specialty";
import type { PlatformAuditActionCode, PlatformAuditEvent } from "@/components/domain/platform-admin/types";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getSubscriptionPlansMockData, getPlanEntitlementsMockData } from "@/features/subscription/mock-plans-data";
import { getTenantsMockData } from "./mock-tenants-data";
import { getPlatformSubscriptionsMockData } from "./mock-platform-subscriptions-data";
import { getPlatformMembershipsMockData, getPlatformUsersMockData } from "./mock-platform-users-data";
import { getPlatformAuditEventsMockData } from "./mock-platform-audit-data";
import { applyTenantAction, getAvailableTenantActions } from "./tenants";
import { applySubscriptionAction, getAvailableSubscriptionActions } from "./subscriptions";
import { getAuditActionLabelKey, sortPlatformAuditEventsDescending } from "./audit";

type DetailTab = "overview" | "subscription" | "users" | "history";

/** Reuses the exact translation keys `/app/abonnement` itself already ships (UI-011ABC) — never a second, independently invented entitlement-label namespace. */
const ENTITLEMENT_LABEL_KEYS: Record<string, string> = {
  max_practitioners: "abonnement.usage.practitioners",
  max_staff: "abonnement.usage.staff",
  storage_bytes: "abonnement.usage.storage",
  inventory_enabled: "abonnement.plans.row.inventory_enabled",
  hr_enabled: "abonnement.plans.row.hr_enabled",
  commission_enabled: "abonnement.plans.row.commission_enabled",
};

interface PendingAction {
  kind: "tenant" | "subscription";
  action: PlatformAuditActionCode;
}

export interface TenantDetailPageProps {
  tenantId: string;
}

/**
 * Tenant 360° (UI-013ABCDE Gate 2 §14, wireframe Screen 56). Tabs are a
 * local, JS-only tablist (`role="tablist"`) rather than the shared `Tabs`
 * component — `Tabs`'s own doc comment reserves it for real per-URL
 * navigation, and task §9 explicitly says "do not invent unnecessarily
 * deep routing," so `/admin/tenants/[id]/subscription` etc. are
 * deliberately not separate routes. Bounded status actions (task §15/§20)
 * update local component state only (task §1: "NO real tenant suspension
 * ... NO real subscription mutation") and append to a page-local history
 * list — this does NOT propagate to `/admin/activity`'s own static feed;
 * see `docs/implementation/RISKS_AND_BLOCKERS.md` for the recorded
 * boundary (mirrors UI-012ABCDE's RISK-016 precedent).
 */
export function TenantDetailPage({ tenantId }: TenantDetailPageProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const tenants = useMemo(() => getTenantsMockData(), []);
  const subscriptions = useMemo(() => getPlatformSubscriptionsMockData(), []);
  const plans = useMemo(() => getSubscriptionPlansMockData(), []);
  const entitlements = useMemo(() => getPlanEntitlementsMockData(), []);
  const memberships = useMemo(() => getPlatformMembershipsMockData(), []);
  const users = useMemo(() => getPlatformUsersMockData(), []);
  const staticHistory = useMemo(
    () => getPlatformAuditEventsMockData().filter((event) => event.tenantId === tenantId),
    [tenantId],
  );

  const baseTenant = tenants.find((t2) => t2.id === tenantId);
  const baseSubscription = subscriptions.find((subscription) => subscription.tenantId === tenantId);

  const [tenant, setTenant] = useState(baseTenant);
  const [subscription, setSubscription] = useState(baseSubscription);
  const [localHistory, setLocalHistory] = useState<PlatformAuditEvent[]>(staticHistory);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sequence, setSequence] = useState(1);

  if (!tenant) {
    return <EmptyState title={t("admin.tenants.detail.notFound.title")} description={t("admin.tenants.detail.notFound.description")} />;
  }

  const plan = subscription ? plans.find((p) => p.id === subscription.planId) : undefined;
  const tenantMemberships = memberships.filter((membership) => membership.tenantId === tenantId);
  const tenantUsers = tenantMemberships.map((membership) => ({
    membership,
    user: users.find((user) => user.id === membership.userId),
  }));
  const planEntitlements = plan ? entitlements.filter((entitlement) => entitlement.planId === plan.id) : [];

  const tenantMeta = TENANT_STATUS_MAP[tenant.status];
  const subscriptionMeta = subscription ? SUBSCRIPTION_STATUS_MAP[subscription.status] : null;
  const availableTenantActions = getAvailableTenantActions(tenant.status);
  const availableSubscriptionActions = subscription ? getAvailableSubscriptionActions(subscription.status) : [];

  function actionLabelKey(action: PlatformAuditActionCode) {
    return `admin.tenants.detail.actions.${action.replace(/\./g, "_")}`;
  }

  function confirmAction() {
    if (!pendingAction) return;
    const id = `local-history-${sequence}`;
    setSequence((current) => current + 1);

    if (pendingAction.kind === "tenant" && tenant) {
      const updated = applyTenantAction(tenant, pendingAction.action as "tenant.suspended" | "tenant.reactivated");
      setTenant(updated);
      setLocalHistory((current) => [
        { id, occurredAt: MOCK_BUSINESS_DATE, actionCode: pendingAction.action, tenantId, resourceType: "tenant", resourceId: tenantId, reason: reason.trim() || undefined },
        ...current,
      ]);
      setToastMessage(t("admin.tenants.detail.toast.tenantUpdated"));
    } else if (pendingAction.kind === "subscription" && subscription) {
      const updated = applySubscriptionAction(
        subscription,
        pendingAction.action as "subscription.manual_renewal" | "subscription.blackout_forced" | "subscription.cancelled",
        MOCK_BUSINESS_DATE,
      );
      setSubscription(updated);
      setLocalHistory((current) => [
        { id, occurredAt: MOCK_BUSINESS_DATE, actionCode: pendingAction.action, tenantId, resourceType: "subscription", resourceId: subscription.id, reason: reason.trim() || undefined },
        ...current,
      ]);
      setToastMessage(t("admin.tenants.detail.toast.subscriptionUpdated"));
    }

    setPendingAction(null);
    setReason("");
  }

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "overview", label: t("admin.tenants.detail.tabs.overview") },
    { key: "subscription", label: t("admin.tenants.detail.tabs.subscription") },
    { key: "users", label: t("admin.tenants.detail.tabs.users") },
    { key: "history", label: t("admin.tenants.detail.tabs.history") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/tenants" className="text-sm font-medium text-primary hover:underline">
        {t("admin.tenants.detail.backLink")}
      </Link>

      <PageHeader
        title={tenant.name}
        description={t(CABINET_SPECIALTY_MAP[tenant.specialty].translationKey)}
        secondaryAction={<StatusBadge tone={tenantMeta.tone}>{t(tenantMeta.translationKey)}</StatusBadge>}
      />

      <nav role="tablist" aria-label={t("admin.tenants.detail.tabsAriaLabel")} className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
          <Card className="flex flex-col gap-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-text-muted">{t("admin.tenants.detail.fields.city")}</dt>
                <dd className="text-sm text-text">{tenant.city ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-text-muted">{t("admin.tenants.detail.fields.createdAt")}</dt>
                <dd className="text-sm text-text">{tenant.createdAt}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-text-muted">{t("admin.tenants.detail.fields.slug")}</dt>
                <dd className="text-sm text-text" dir="ltr">
                  {tenant.slug}
                </dd>
              </div>
            </dl>

            {availableTenantActions.length > 0 && (
              <div className="flex gap-3 border-t border-border pt-4">
                {availableTenantActions.map((action) => (
                  <Button
                    key={action}
                    variant={action === "tenant.suspended" ? "danger" : "primary"}
                    size="sm"
                    onClick={() => setPendingAction({ kind: "tenant", action })}
                  >
                    {t(actionLabelKey(action))}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "subscription" && (
        <div id="panel-subscription" role="tabpanel" aria-labelledby="tab-subscription">
          {!subscription ? (
            <EmptyState title={t("admin.tenants.detail.noSubscription")} />
          ) : (
            <Card className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {subscriptionMeta && <StatusBadge tone={subscriptionMeta.tone}>{t(subscriptionMeta.translationKey)}</StatusBadge>}
                <span className="text-sm text-text-secondary">{plan?.name ?? "—"}</span>
              </div>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase text-text-muted">{t("admin.tenants.detail.fields.currentPeriodEnd")}</dt>
                  <dd className="text-sm text-text">{subscription.currentPeriodEnd ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-text-muted">{t("admin.tenants.detail.fields.trialEndsAt")}</dt>
                  <dd className="text-sm text-text">{subscription.trialEndsAt ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-text-muted">{t("admin.tenants.detail.fields.graceEndsAt")}</dt>
                  <dd className="text-sm text-text">{subscription.graceEndsAt ?? "—"}</dd>
                </div>
              </dl>

              {planEntitlements.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-medium uppercase text-text-muted">{t("admin.tenants.detail.entitlementsTitle")}</h3>
                  <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {planEntitlements.map((entitlement) => (
                      <li key={entitlement.entitlementCode} className="text-sm text-text-secondary">
                        {t(ENTITLEMENT_LABEL_KEYS[entitlement.entitlementCode] ?? entitlement.entitlementCode)}
                        {entitlement.limitValue !== undefined ? `: ${entitlement.limitValue}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {availableSubscriptionActions.length > 0 && (
                <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                  {availableSubscriptionActions.map((action) => (
                    <Button
                      key={action}
                      variant={action === "subscription.cancelled" ? "danger" : "primary"}
                      size="sm"
                      onClick={() => setPendingAction({ kind: "subscription", action })}
                    >
                      {t(actionLabelKey(action))}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div id="panel-users" role="tabpanel" aria-labelledby="tab-users">
          {tenantUsers.length === 0 ? (
            <EmptyState title={t("admin.tenants.detail.noUsers")} />
          ) : (
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-muted">
                    <th className="px-4 py-3 font-medium">{t("admin.tenants.detail.usersTable.name")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.tenants.detail.usersTable.profile")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.tenants.detail.usersTable.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantUsers.map(({ membership, user }) => (
                    <tr key={membership.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text">{user?.displayName ?? "—"}</p>
                        <p className="text-xs text-text-muted" dir="ltr">
                          {user?.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {t(`admin.users.profileType.${membership.profileType}`)}
                        {membership.isOwner && ` (${t("admin.users.ownerBadge")})`}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{t(`admin.users.membershipStatus.${membership.status}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div id="panel-history" role="tabpanel" aria-labelledby="tab-history">
          {localHistory.length === 0 ? (
            <EmptyState title={t("admin.tenants.detail.noHistory")} />
          ) : (
            <Card className="p-0">
              <ul className="divide-y divide-border">
                {sortPlatformAuditEventsDescending(localHistory).map((event) => (
                  <li key={event.id} className="px-4 py-3 text-sm">
                    <p className="text-text">{t(getAuditActionLabelKey(event.actionCode))}</p>
                    <p className="text-xs text-text-muted">{event.occurredAt}</p>
                    {event.reason && <p className="mt-1 text-xs text-text-secondary">{event.reason}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        onClose={() => {
          setPendingAction(null);
          setReason("");
        }}
        onConfirm={confirmAction}
        title={pendingAction ? t(actionLabelKey(pendingAction.action)) : ""}
        description={t("admin.tenants.detail.actionReasonPrompt")}
        cancelLabel={t("admin.tenants.detail.actionCancel")}
        confirmLabel={t("admin.tenants.detail.actionConfirm")}
        tone={pendingAction?.action === "tenant.suspended" || pendingAction?.action === "subscription.cancelled" ? "danger" : "primary"}
      >
        <Textarea label={t("admin.tenants.detail.actionReasonLabel")} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
      </ConfirmDialog>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
