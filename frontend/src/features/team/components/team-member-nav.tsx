"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Tabs } from "@/components/ui/tabs";

export type TeamMemberTabKey = "profile" | "contract" | "schedule";

const TAB_ORDER: TeamMemberTabKey[] = ["profile", "contract", "schedule"];

const TAB_PATH_SUFFIX: Record<TeamMemberTabKey, string> = {
  profile: "",
  contract: "/contract",
  schedule: "/schedule",
};

export interface TeamMemberNavProps {
  memberId: string;
  activeTab: TeamMemberTabKey;
}

/**
 * Employee 360° internal navigation (UI-007B §6-9) — Profil/Contrat/
 * Planning, the three sections that actually exist today. Mirrors
 * `PatientDetailPage`'s own `Tabs` usage (an explicit `activeTab` prop
 * built into each per-id href, not `usePathname` prefix-matching like
 * `FinanceNav` — that pattern only works for non-parameterized routes)
 * rather than `FinanceNav`'s pattern, since this nav is nested under a
 * per-member `[id]`. Présence/Congés/Paie/Commissions (Screen 34's later
 * tabs) are not shown — they have no route yet, and this task's own §7
 * explicit default is "otherwise show only currently implemented items."
 */
export function TeamMemberNav({ memberId, activeTab }: TeamMemberNavProps) {
  const { t } = useLocale();

  return (
    <Tabs
      ariaLabel={t("teamDetail.tabs.navigationLabel")}
      activeKey={activeTab}
      items={TAB_ORDER.map((tab) => ({
        key: tab,
        label: t(`teamDetail.tabs.${tab}`),
        href: `/app/equipe/${memberId}${TAB_PATH_SUFFIX[tab]}`,
      }))}
    />
  );
}
