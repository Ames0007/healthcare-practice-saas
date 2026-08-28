"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import type { PlanEntitlement, SubscriptionPlan } from "@/components/domain/subscription/types";
import type { Subscription } from "@/components/domain/subscription/types";
import type { TeamMember } from "@/components/domain/team/types";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getSubscriptionMockData } from "./mock-subscription-data";
import { getPlanEntitlementsMockData, getSubscriptionPlansMockData } from "./mock-plans-data";
import { getEntitlementLimit, getUsageState, hasEntitlement } from "./entitlements";
import { countActivePractitioners, countActiveStaff } from "./usage";
import { SubscriptionNav } from "./components/subscription-nav";
import { SubscriptionSkeleton } from "./components/subscription-skeleton";
import { EntitlementLimitNotice } from "./components/entitlement-limit-notice";

export type PlansPageState = "loading" | "loaded" | "error";

export interface PlansPageProps {
  subscription?: Subscription;
  plans?: SubscriptionPlan[];
  entitlements?: PlanEntitlement[];
  teamMembers?: TeamMember[];
  state?: PlansPageState;
  onRetry?: () => void;
}

/**
 * Plans (UI-011ABC Gate 2), `/app/abonnement/plans` — a restrained
 * two-column comparison (task §28: "If multiple plans are defined by
 * specs, implement a restrained comparison"; only Solo/Cabinet are
 * modeled, see `PlanCode`'s own doc comment). Prices show "À définir"
 * for every cell (`PlanPrice.amount` is always `undefined`, ADR-010) —
 * never an invented MAD figure. "Choisir ce plan" never mutates
 * `subscription` — it opens the same informational dialog as the main
 * Abonnement page's "Renouveler" action (task §29: "must NOT immediately
 * mutate into a paid subscription... No payment").
 */
export function PlansPage({
  subscription: providedSubscription,
  plans: providedPlans,
  entitlements: providedEntitlements,
  teamMembers: providedTeamMembers,
  state = "loaded",
  onRetry,
}: PlansPageProps) {
  const { t } = useLocale();
  const [selectDialogPlanName, setSelectDialogPlanName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (state === "loading") {
    return <SubscriptionSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("abonnement.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("abonnement.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const subscription = providedSubscription ?? getSubscriptionMockData();
  const plans = providedPlans ?? getSubscriptionPlansMockData();
  const entitlements = providedEntitlements ?? getPlanEntitlementsMockData();
  const members = providedTeamMembers ?? getTeamMembersMockData();

  const activePractitioners = countActivePractitioners(members);
  const activeStaff = countActiveStaff(members);

  function handleAcknowledge() {
    setSelectDialogPlanName(null);
    setToastMessage(t("abonnement.toast.acknowledged"));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("abonnement.plans.pageTitle")} description={t("abonnement.plans.pageDescription")} />

      <SubscriptionNav />

      <p className="text-sm text-text-secondary">
        {t("abonnement.plans.currentUsage", { practitioners: activePractitioners, staff: activeStaff })}
      </p>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-medium" />
              {plans.map((plan) => (
                <th key={plan.id} className="px-4 py-3 font-medium text-text">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-4 py-3 font-medium text-text">{t("abonnement.plans.row.price")}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-text-muted">
                  {t("abonnement.plans.priceTbd")}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-3 font-medium text-text">{t("abonnement.usage.practitioners")}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-4 py-3 tabular-nums text-text" dir="ltr">
                  {getEntitlementLimit(entitlements, plan.id, "max_practitioners") ?? t("abonnement.usage.undefinedLimit")}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-3 font-medium text-text">{t("abonnement.usage.staff")}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-4 py-3 tabular-nums text-text" dir="ltr">
                  {getEntitlementLimit(entitlements, plan.id, "max_staff") ?? t("abonnement.usage.undefinedLimit")}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-3 font-medium text-text">{t("abonnement.usage.storage")}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-text-muted">
                  {t("abonnement.usage.undefinedLimit")}
                </td>
              ))}
            </tr>
            {(["inventory_enabled", "hr_enabled", "commission_enabled"] as const).map((code) => (
              <tr key={code} className="border-b border-border">
                <td className="px-4 py-3 font-medium text-text">{t(`abonnement.plans.row.${code}`)}</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-4 py-3">
                    {hasEntitlement(entitlements, plan.id, code) ? (
                      <StatusBadge tone="success">{t("abonnement.plans.included")}</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">{t("abonnement.plans.notIncluded")}</StatusBadge>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="px-4 py-3" />
              {plans.map((plan) => {
                const isCurrent = plan.id === subscription.planId;
                const practitionerLimit = getEntitlementLimit(entitlements, plan.id, "max_practitioners");
                const usage = getUsageState(practitionerLimit, activePractitioners);

                return (
                  <td key={plan.id} className="px-4 py-3 align-top">
                    {isCurrent ? (
                      <StatusBadge tone="primary">{t("abonnement.plans.currentPlan")}</StatusBadge>
                    ) : usage.overLimit ? (
                      <EntitlementLimitNotice
                        message={t("abonnement.plans.limitBlocksSelection", {
                          used: usage.used,
                          limit: usage.limit ?? 0,
                        })}
                      />
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setSelectDialogPlanName(plan.name)}>
                        {t("abonnement.plans.choosePlan")}
                      </Button>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </Card>

      <ConfirmDialog
        open={selectDialogPlanName !== null}
        onClose={() => setSelectDialogPlanName(null)}
        onConfirm={handleAcknowledge}
        title={t("abonnement.renewDialog.title")}
        description={t("abonnement.renewDialog.description")}
        cancelLabel={t("abonnement.renewDialog.cancel")}
        confirmLabel={t("abonnement.renewDialog.confirm")}
      />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
