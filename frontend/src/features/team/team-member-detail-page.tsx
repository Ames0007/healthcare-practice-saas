"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassNames } from "@/components/ui/button";
import type { EmploymentContract, TeamMember, WorkInterval } from "@/components/domain/team/types";
import { getTeamMembersMockData } from "./mock-data";
import { getContractsMockData } from "./mock-contracts-data";
import { getWorkIntervalsMockData } from "./mock-schedule-data";
import { getCurrentContract } from "./contracts";
import { getIntervalsForMember } from "./schedule";
import { TeamMemberHeader } from "./components/team-member-header";
import { TeamMemberNav, type TeamMemberTabKey } from "./components/team-member-nav";
import { TeamMemberProfileContent } from "./components/team-member-profile-content";
import { TeamMemberContractContent } from "./components/team-member-contract-content";
import { TeamMemberScheduleContent } from "./components/team-member-schedule-content";
import { TeamMemberDetailSkeleton } from "./components/team-member-detail-skeleton";

export type TeamMemberDetailState = "loading" | "loaded" | "error";

export interface TeamMemberDetailPageProps {
  memberId: string;
  activeTab?: TeamMemberTabKey;
  state?: TeamMemberDetailState;
  /** Prototype seams for tests, mirrors `PatientDetailPage` (UI-004A §11). */
  members?: TeamMember[];
  contracts?: EmploymentContract[];
  workIntervals?: WorkInterval[];
  onRetry?: () => void;
}

/**
 * Employee 360° (UI-007B §6, extends UI-007A's own single-tab profile).
 * Header + `TeamMemberNav` (Profil/Contrat/Planning) are shared shell
 * chrome; each tab's own content — and its own bounded edit action — is
 * a sibling component, mirroring `PatientDetailPage`'s exact
 * header-then-tabs-then-switched-content architecture.
 *
 * Looks the member/contract/schedule up from the same centralized seed
 * datasets the rest of Équipe uses, but every edit made here updates only
 * this page's own local state — the same documented prototype limitation
 * as `PatientDetailPage` (UI-004A §7) and UI-007A's own profile edit:
 * there is no shared store yet, so a change made in one screen is not
 * visible in another until real API integration replaces this seam.
 */
export function TeamMemberDetailPage({
  memberId,
  activeTab = "profile",
  state = "loaded",
  members: providedMembers,
  contracts: providedContracts,
  workIntervals: providedWorkIntervals,
  onRetry,
}: TeamMemberDetailPageProps) {
  const { t } = useLocale();
  const [overrideMember, setOverrideMember] = useState<TeamMember | null>(null);
  const [overrideContract, setOverrideContract] = useState<EmploymentContract | null>(null);
  const [overrideIntervals, setOverrideIntervals] = useState<WorkInterval[] | null>(null);

  if (state === "loading") {
    return <TeamMemberDetailSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("teamDetail.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("teamDetail.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const members = providedMembers ?? getTeamMembersMockData();
  const seedMember = members.find((candidate) => candidate.id === memberId) ?? null;
  const member = overrideMember ?? seedMember;

  if (!member) {
    return (
      <EmptyState
        title={t("teamDetail.notFoundTitle")}
        description={t("teamDetail.notFoundDescription")}
        primaryAction={
          <Link href="/app/equipe" className={buttonClassNames("primary", "sm")}>
            {t("teamDetail.backToTeam")}
          </Link>
        }
      />
    );
  }

  const contracts = providedContracts ?? getContractsMockData();
  const seedContract = getCurrentContract(contracts, memberId);
  const contract = overrideContract ?? seedContract;

  const workIntervals = providedWorkIntervals ?? getWorkIntervalsMockData();
  const memberIntervals = overrideIntervals ?? getIntervalsForMember(workIntervals, memberId);

  return (
    <div className="flex flex-col gap-6">
      <TeamMemberHeader member={member} />
      <TeamMemberNav memberId={memberId} activeTab={activeTab} />

      {activeTab === "profile" ? (
        <TeamMemberProfileContent member={member} onMemberChange={setOverrideMember} />
      ) : activeTab === "contract" ? (
        <TeamMemberContractContent contract={contract} onContractChange={setOverrideContract} />
      ) : (
        <TeamMemberScheduleContent teamMemberId={memberId} intervals={memberIntervals} onIntervalsChange={setOverrideIntervals} />
      )}
    </div>
  );
}
