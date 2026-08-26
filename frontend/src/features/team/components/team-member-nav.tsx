"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Tabs } from "@/components/ui/tabs";

export type TeamMemberTabKey = "profile" | "contract" | "schedule" | "attendance" | "leave" | "payroll" | "commissions";

const BASE_TAB_ORDER: TeamMemberTabKey[] = ["profile", "contract", "schedule", "attendance", "leave", "payroll"];

const TAB_PATH_SUFFIX: Record<TeamMemberTabKey, string> = {
  profile: "",
  contract: "/contract",
  schedule: "/schedule",
  attendance: "/attendance",
  leave: "/leave",
  payroll: "/payroll",
  commissions: "/commissions",
};

export interface TeamMemberNavProps {
  memberId: string;
  activeTab: TeamMemberTabKey;
  /** Practitioner-only (UI-007CDEF §8/§52/§62) — omitted entirely for every other role, never a disabled tab. */
  showCommissions?: boolean;
}

/**
 * Employee 360° internal navigation — Profil/Contrat/Planning/Présence/
 * Congés/Paie, plus Commissions for practitioners only. Mirrors
 * `PatientDetailPage`'s own `Tabs` usage (an explicit `activeTab` prop
 * built into each per-id href, not `usePathname` prefix-matching like
 * `FinanceNav` — that pattern only works for non-parameterized routes)
 * rather than `FinanceNav`'s pattern, since this nav is nested under a
 * per-member `[id]`. Documents/Permissions (Screen 34's later tabs) are
 * still not shown — no route exists for them, matching this session's
 * own "otherwise show only currently implemented items" default.
 */
export function TeamMemberNav({ memberId, activeTab, showCommissions = false }: TeamMemberNavProps) {
  const { t } = useLocale();
  const tabOrder = showCommissions ? [...BASE_TAB_ORDER, "commissions" as const] : BASE_TAB_ORDER;

  return (
    <Tabs
      ariaLabel={t("teamDetail.tabs.navigationLabel")}
      activeKey={activeTab}
      items={tabOrder.map((tab) => ({
        key: tab,
        label: t(`teamDetail.tabs.${tab}`),
        href: `/app/equipe/${memberId}${TAB_PATH_SUFFIX[tab]}`,
      }))}
    />
  );
}
