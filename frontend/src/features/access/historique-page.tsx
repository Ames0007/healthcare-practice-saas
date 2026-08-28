"use client";

import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { AccessAuditEvent, TenantMembership, UserAccount } from "@/components/domain/access/types";
import { getAccessAuditEventsMockData } from "./mock-audit-data";
import { getTenantMembershipsMockData, getUserAccountsMockData } from "./mock-users-data";
import { resolveAuditDetailLabel, sortAuditEventsDescending } from "./audit";
import { formatDayMonthYear } from "@/features/patients/format";
import { ParametresNav } from "@/features/parametres/components/parametres-nav";
import { AccessGovernanceNav } from "./components/access-governance-nav";
import { AccessSkeleton } from "./components/access-skeleton";

export type HistoriquePageState = "loading" | "loaded" | "error";

export interface HistoriquePageProps {
  events?: AccessAuditEvent[];
  users?: UserAccount[];
  memberships?: TenantMembership[];
  state?: HistoriquePageState;
  onRetry?: () => void;
}

function membershipUserName(membershipId: string, memberships: TenantMembership[], users: UserAccount[]): string {
  const membership = memberships.find((candidate) => candidate.id === membershipId);
  const user = users.find((candidate) => candidate.id === membership?.userId);
  return user?.displayName ?? membershipId;
}

/**
 * Historique (UI-011X Gate 4), `/app/parametres/access/historique` —
 * read-only, newest-first (task §23). A static fixture list standing in
 * for a real append-only audit log (CLAUDE.md §39's actual guarantee is
 * a backend concern this prototype does not implement) — no filter/
 * export/delete affordance, since this page only demonstrates the
 * presentation, not a real audit-management tool.
 */
export function HistoriquePage({ events: providedEvents, users: providedUsers, memberships: providedMemberships, state = "loaded", onRetry }: HistoriquePageProps) {
  const { t, locale } = useLocale();

  if (state === "loading") {
    return <AccessSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("access.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("access.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const users = providedUsers ?? getUserAccountsMockData();
  const memberships = providedMemberships ?? getTenantMembershipsMockData();
  const events = sortAuditEventsDescending(providedEvents ?? getAccessAuditEventsMockData());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("access.historique.pageTitle")} description={t("access.historique.pageDescription")} />

      <ParametresNav />

      <AccessGovernanceNav />

      {events.length === 0 ? (
        <EmptyState title={t("access.historique.emptyTitle")} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">{t("access.historique.table.date")}</th>
                <th className="px-4 py-3 font-medium">{t("access.historique.table.event")}</th>
                <th className="px-4 py-3 font-medium">{t("access.historique.table.actor")}</th>
                <th className="px-4 py-3 font-medium">{t("access.historique.table.target")}</th>
                <th className="px-4 py-3 font-medium">{t("access.historique.table.detail")}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-secondary" dir="ltr">
                    {formatDayMonthYear(event.occurredAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-text">{t(`access.historique.event.${event.type}`)}</td>
                  <td className="px-4 py-3 text-text">{membershipUserName(event.actorMembershipId, memberships, users)}</td>
                  <td className="px-4 py-3 text-text">{membershipUserName(event.targetMembershipId, memberships, users)}</td>
                  <td className="px-4 py-3 text-text-secondary">{resolveAuditDetailLabel(event, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
