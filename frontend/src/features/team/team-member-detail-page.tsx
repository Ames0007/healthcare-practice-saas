"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassNames } from "@/components/ui/button";
import type {
  AttendanceRecord,
  CommissionRule,
  EmploymentContract,
  LeaveBalance,
  LeaveRequest,
  PayrollEntry,
  PayrollPeriod,
  TeamMember,
  WorkInterval,
} from "@/components/domain/team/types";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { MOCK_NOW_TIME } from "@/features/agenda/mock-data";
import { getTeamMembersMockData } from "./mock-data";
import { getContractsMockData } from "./mock-contracts-data";
import { getWorkIntervalsMockData } from "./mock-schedule-data";
import { getAttendanceMockData } from "./mock-attendance-data";
import { getLeaveBalancesMockData, getLeaveRequestsMockData } from "./mock-leave-data";
import { getPayrollEntriesMockData, getPayrollPeriodsMockData } from "./mock-payroll-data";
import { getCommissionRulesMockData } from "./mock-commissions-data";
import { getCurrentContract } from "./contracts";
import { getIntervalsForMember } from "./schedule";
import { getAttendanceForDate } from "./attendance";
import { doesApprovedLeaveCoverDate } from "./leave";
import { getCommissionRuleForMember, isCommissionEligible } from "./commissions";
import { TeamMemberHeader } from "./components/team-member-header";
import { TeamMemberNav, type TeamMemberTabKey } from "./components/team-member-nav";
import { TeamMemberProfileContent } from "./components/team-member-profile-content";
import { TeamMemberContractContent } from "./components/team-member-contract-content";
import { TeamMemberScheduleContent } from "./components/team-member-schedule-content";
import { TeamMemberAttendanceContent } from "./components/team-member-attendance-content";
import { TeamMemberLeaveContent } from "./components/team-member-leave-content";
import { TeamMemberPayrollContent } from "./components/team-member-payroll-content";
import { TeamMemberCommissionsContent } from "./components/team-member-commissions-content";
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
  attendanceRecords?: AttendanceRecord[];
  leaveRequests?: LeaveRequest[];
  leaveBalances?: LeaveBalance[];
  payrollPeriods?: PayrollPeriod[];
  payrollEntries?: PayrollEntry[];
  commissionRules?: CommissionRule[];
  /** Seam so a real work day can be exercised in tests without depending on the literal live "today" (§15). */
  businessDate?: string;
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
  attendanceRecords: providedAttendanceRecords,
  leaveRequests: providedLeaveRequests,
  leaveBalances: providedLeaveBalances,
  payrollPeriods: providedPayrollPeriods,
  payrollEntries: providedPayrollEntries,
  commissionRules: providedCommissionRules,
  businessDate = MOCK_BUSINESS_DATE,
  onRetry,
}: TeamMemberDetailPageProps) {
  const { t } = useLocale();
  const [overrideMember, setOverrideMember] = useState<TeamMember | null>(null);
  const [overrideContract, setOverrideContract] = useState<EmploymentContract | null>(null);
  const [overrideIntervals, setOverrideIntervals] = useState<WorkInterval[] | null>(null);
  const [overrideAttendanceRecords, setOverrideAttendanceRecords] = useState<AttendanceRecord[] | null>(null);
  const [overrideLeaveRequests, setOverrideLeaveRequests] = useState<LeaveRequest[] | null>(null);
  const [overrideLeaveBalances, setOverrideLeaveBalances] = useState<LeaveBalance[] | null>(null);
  const [overridePayrollEntries, setOverridePayrollEntries] = useState<PayrollEntry[] | null>(null);

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

  const attendanceRecords = overrideAttendanceRecords ?? providedAttendanceRecords ?? getAttendanceMockData();
  const leaveRequests = overrideLeaveRequests ?? providedLeaveRequests ?? getLeaveRequestsMockData();
  const leaveBalances = overrideLeaveBalances ?? providedLeaveBalances ?? getLeaveBalancesMockData();
  const isOnApprovedLeave = doesApprovedLeaveCoverDate(leaveRequests, memberId, businessDate);
  const payrollPeriods = providedPayrollPeriods ?? getPayrollPeriodsMockData();
  const payrollEntries = overridePayrollEntries ?? providedPayrollEntries ?? getPayrollEntriesMockData();
  const commissionRules = providedCommissionRules ?? getCommissionRulesMockData();
  const commissionRule = isCommissionEligible(member) ? getCommissionRuleForMember(commissionRules, memberId) : null;

  function handleCheckIn() {
    const existing = getAttendanceForDate(attendanceRecords, memberId, businessDate);
    const next = existing
      ? attendanceRecords.map((record) => (record.id === existing.id ? { ...record, checkIn: MOCK_NOW_TIME } : record))
      : [...attendanceRecords, { id: `att-${memberId}-${businessDate}`, teamMemberId: memberId, businessDate, checkIn: MOCK_NOW_TIME }];
    setOverrideAttendanceRecords(next);
  }

  function handleCheckOut() {
    const existing = getAttendanceForDate(attendanceRecords, memberId, businessDate);
    if (!existing) return;
    setOverrideAttendanceRecords(
      attendanceRecords.map((record) => (record.id === existing.id ? { ...record, checkOut: MOCK_NOW_TIME } : record)),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TeamMemberHeader member={member} />
      <TeamMemberNav memberId={memberId} activeTab={activeTab} showCommissions={isCommissionEligible(member)} />

      {activeTab === "profile" ? (
        <TeamMemberProfileContent member={member} onMemberChange={setOverrideMember} />
      ) : activeTab === "contract" ? (
        <TeamMemberContractContent contract={contract} onContractChange={setOverrideContract} />
      ) : activeTab === "schedule" ? (
        <TeamMemberScheduleContent teamMemberId={memberId} intervals={memberIntervals} onIntervalsChange={setOverrideIntervals} />
      ) : activeTab === "attendance" ? (
        <TeamMemberAttendanceContent
          teamMemberId={memberId}
          businessDate={businessDate}
          todayIso={MOCK_BUSINESS_DATE}
          workIntervals={workIntervals}
          attendanceRecords={attendanceRecords}
          isOnApprovedLeave={isOnApprovedLeave}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />
      ) : activeTab === "leave" ? (
        <TeamMemberLeaveContent
          teamMemberId={memberId}
          requests={leaveRequests}
          balances={leaveBalances}
          onRequestsChange={setOverrideLeaveRequests}
          onBalancesChange={setOverrideLeaveBalances}
        />
      ) : activeTab === "payroll" ? (
        <TeamMemberPayrollContent member={member} periods={payrollPeriods} entries={payrollEntries} onEntriesChange={setOverridePayrollEntries} />
      ) : activeTab === "commissions" ? (
        commissionRule ? (
          <TeamMemberCommissionsContent member={member} rule={commissionRule} periods={payrollPeriods} />
        ) : (
          <EmptyState title={t("teamDetail.commissions.notApplicable.title")} description={t("teamDetail.commissions.notApplicable.description")} />
        )
      ) : null}
    </div>
  );
}
