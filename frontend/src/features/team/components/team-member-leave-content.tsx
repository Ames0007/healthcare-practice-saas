"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import { LEAVE_TYPE_MAP } from "@/components/domain/team/leave-type";
import { LEAVE_STATUS_MAP } from "@/components/domain/team/leave-status";
import type { LeaveBalance, LeaveRequest, LeaveRequestFormValues } from "@/components/domain/team/types";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { computeLeaveDurationDays, computePendingDays, getLeaveBalance, getLeaveRequestsForMember } from "@/features/team/leave";
import { formatDayMonthYear } from "@/features/team/format";
import { LeaveRequestFormDialog } from "./leave-request-form-dialog";
import { LeaveDecisionDialog } from "./leave-decision-dialog";

export interface TeamMemberLeaveContentProps {
  teamMemberId: string;
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  onRequestsChange: (requests: LeaveRequest[]) => void;
  onBalancesChange: (balances: LeaveBalance[]) => void;
}

/**
 * The "Congés" tab (UI-007CDEF §30-32) — combines Screen 36's staff
 * ("Mes congés") and owner ("Approve/Reject") views into one per-employee
 * surface, since this prototype has no real multi-viewpoint role
 * switching yet. Approving moves the request's own duration from
 * `available` to `used` on its balance (§35); rejecting/staying pending
 * never touches the balance.
 */
export function TeamMemberLeaveContent({ teamMemberId, requests, balances, onRequestsChange, onBalancesChange }: TeamMemberLeaveContentProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [decisionState, setDecisionState] = useState<{ request: LeaveRequest; decision: "approved" | "rejected" } | null>(null);

  const memberRequests = getLeaveRequestsForMember(requests, teamMemberId);
  const annualBalance = getLeaveBalance(balances, teamMemberId, "annual");
  const pendingAnnualDays = computePendingDays(requests, teamMemberId, "annual");

  function handleCreateRequest(values: LeaveRequestFormValues) {
    const created: LeaveRequest = {
      id: `lr-${teamMemberId}-${requests.length + 1}`,
      teamMemberId,
      leaveType: values.leaveType,
      startDate: values.startDate,
      endDate: values.endDate,
      duration: computeLeaveDurationDays(values.startDate, values.endDate),
      reason: values.reason || undefined,
      status: "pending",
      requestedAt: MOCK_BUSINESS_DATE,
    };
    onRequestsChange([created, ...requests]);
    setFormOpen(false);
    setToastMessage(t("teamDetail.leave.toast.created"));
  }

  function handleDecision(reviewNote?: string) {
    if (!decisionState) return;
    const { request, decision } = decisionState;

    onRequestsChange(
      requests.map((candidate) =>
        candidate.id === request.id
          ? { ...candidate, status: decision, reviewedBy: t("teamDetail.leave.defaultReviewer"), reviewedAt: MOCK_BUSINESS_DATE, reviewNote }
          : candidate,
      ),
    );

    if (decision === "approved") {
      const balance = getLeaveBalance(balances, teamMemberId, request.leaveType);
      if (balance) {
        onBalancesChange(
          balances.map((candidate) =>
            candidate.teamMemberId === teamMemberId && candidate.leaveType === request.leaveType
              ? { ...candidate, available: candidate.available - request.duration, used: candidate.used + request.duration }
              : candidate,
          ),
        );
      }
    }

    setDecisionState(null);
    setToastMessage(decision === "approved" ? t("teamDetail.leave.toast.approved") : t("teamDetail.leave.toast.rejected"));
  }

  return (
    <div className="flex flex-col gap-6">
      {annualBalance && (
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("teamDetail.leave.balanceTitle")}</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-text-muted">{t("teamDetail.leave.availableLabel")}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-text">{annualBalance.available}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">{t("teamDetail.leave.usedLabel")}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-text">{annualBalance.used}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">{t("teamDetail.leave.pendingLabel")}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-text">{pendingAnnualDays}</dd>
            </div>
          </dl>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("teamDetail.leave.requestsTitle")}</h2>
          <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
            {t("teamDetail.leave.newRequest")}
          </Button>
        </div>

        {memberRequests.length === 0 ? (
          <EmptyState title={t("teamDetail.leave.empty.title")} />
        ) : (
          <div className="mt-4 flex flex-col divide-y divide-border">
            {memberRequests.map((request) => {
              const typeMeta = LEAVE_TYPE_MAP[request.leaveType];
              const statusMeta = LEAVE_STATUS_MAP[request.status];

              return (
                <div key={request.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">{t(typeMeta.translationKey)}</p>
                    <p className="text-xs text-text-muted" dir="ltr">
                      <span>
                        {formatDayMonthYear(request.startDate, locale)} – {formatDayMonthYear(request.endDate, locale)}
                      </span>{" "}
                      <span aria-hidden="true">·</span>{" "}
                      <span>{t("teamDetail.leave.durationValue", { count: request.duration })}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                    {request.status === "pending" && (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => setDecisionState({ request, decision: "approved" })}>
                          {t("teamDetail.leave.approve")}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setDecisionState({ request, decision: "rejected" })}>
                          {t("teamDetail.leave.reject")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <LeaveRequestFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreateRequest} />

      <LeaveDecisionDialog
        request={decisionState?.request ?? null}
        decision={decisionState?.decision ?? "approved"}
        onClose={() => setDecisionState(null)}
        onConfirm={handleDecision}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
