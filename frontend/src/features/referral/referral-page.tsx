"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import type { Referral, ReferralCode, ReferralReward } from "@/components/domain/referral/types";
import { REFERRAL_STATUS_MAP } from "@/components/domain/referral/referral-status";
import { getReferralCodeMockData, getReferralRewardsMockData, getReferralsMockData } from "./mock-referral-data";
import { buildReferralLink } from "./referral-code";
import { findRewardForReferral } from "./rewards";
import { SubscriptionNav } from "@/features/subscription/components/subscription-nav";
import { SubscriptionSkeleton } from "@/features/subscription/components/subscription-skeleton";

export type ReferralPageState = "loading" | "loaded" | "error";

export interface ReferralPageProps {
  referralCode?: ReferralCode;
  referrals?: Referral[];
  rewards?: ReferralReward[];
  state?: ReferralPageState;
  onRetry?: () => void;
}

/**
 * Parrainage (UI-011ABC Gate 3), `/app/abonnement/parrainage` —
 * reproduces Spec #9 Screen 50's own layout (code, link, copy action,
 * referral list). Fraud controls (Spec #5 §41) stay entirely internal —
 * this page shows outcomes only, never a review/approve UI (that is
 * `55.5 Referral administration`'s own separate admin surface, already
 * scoped out of this task). "+N mois" only ever appears next to a
 * `qualified` referral that has a real, matching *applied*
 * `ReferralReward` (`findRewardForReferral`) — never a 7th invented
 * status label composing the two facts.
 */
export function ReferralPage({
  referralCode: providedReferralCode,
  referrals: providedReferrals,
  rewards: providedRewards,
  state = "loaded",
  onRetry,
}: ReferralPageProps) {
  const { t } = useLocale();
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

  const referralCode = providedReferralCode ?? getReferralCodeMockData();
  const referrals = providedReferrals ?? getReferralsMockData();
  const rewards = providedRewards ?? getReferralRewardsMockData();
  const link = buildReferralLink(referralCode.code);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setToastMessage(t("abonnement.parrainage.toast.copied"));
    } catch {
      setToastMessage(t("abonnement.parrainage.toast.copyFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("abonnement.parrainage.pageTitle")} description={t("abonnement.parrainage.pageDescription")} />

      <SubscriptionNav />

      <Card>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("abonnement.parrainage.codeLabel")}</dt>
            <dd className="mt-1 font-mono text-sm text-text" dir="ltr">
              {referralCode.code}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("abonnement.parrainage.linkLabel")}</dt>
            <dd className="mt-1 font-mono text-sm text-text" dir="ltr">
              {link}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <Button size="sm" onClick={handleCopy}>
            {t("abonnement.parrainage.copyAction")}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text">{t("abonnement.parrainage.listTitle")}</h2>
        {referrals.length === 0 ? (
          <EmptyState title={t("abonnement.parrainage.emptyTitle")} description={t("abonnement.parrainage.emptyDescription")} />
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {referrals.map((referral) => {
              const statusMeta = REFERRAL_STATUS_MAP[referral.status];
              const reward = findRewardForReferral(rewards, referral.id);
              return (
                <li key={referral.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium text-text">{referral.referredTenantName ?? t("abonnement.parrainage.unknownTenant")}</span>
                  <span className="flex items-center gap-2">
                    <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                    {reward && reward.status === "applied" && (
                      <span className="text-xs font-medium text-success" dir="ltr">
                        +{reward.rewardMonths} {t("abonnement.parrainage.monthUnit")}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
