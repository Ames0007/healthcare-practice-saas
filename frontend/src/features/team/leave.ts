import type { LeaveBalance, LeaveRequest, LeaveRequestStatus, LeaveType } from "@/components/domain/team/types";

export function getLeaveRequestsForMember(requests: LeaveRequest[], teamMemberId: string): LeaveRequest[] {
  return requests.filter((request) => request.teamMemberId === teamMemberId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

/** Inclusive calendar-day count (UI-007CDEF §31) — no weekend/holiday exclusion invented; matches the task's own worked example ("26-28 août" = 3 days). */
export function computeLeaveDurationDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

/** An end date on or after the start date (§31 — "end >= start", same-day leave is valid, unlike a contract's strictly-after end date rule). */
export function isValidLeaveDateRange(startDate: string, endDate: string): boolean {
  return Boolean(startDate) && Boolean(endDate) && endDate >= startDate;
}

/** Sum of *pending* requests' own duration only (§35 — approved/rejected never contribute here). */
export function computePendingDays(requests: LeaveRequest[], teamMemberId: string, leaveType: LeaveType): number {
  return getLeaveRequestsForMember(requests, teamMemberId)
    .filter((request) => request.leaveType === leaveType && request.status === "pending")
    .reduce((sum, request) => sum + request.duration, 0);
}

export function getLeaveBalance(balances: LeaveBalance[], teamMemberId: string, leaveType: LeaveType): LeaveBalance | null {
  return balances.find((balance) => balance.teamMemberId === teamMemberId && balance.leaveType === leaveType) ?? null;
}

/**
 * Approval moves a request's own duration from `available` into `used`
 * (§35) — a rejection or a still-pending request never touches either
 * figure (proven by never calling this outside the approve action).
 */
export function applyApprovedLeaveToBalance(balance: LeaveBalance, request: LeaveRequest): LeaveBalance {
  return { ...balance, available: balance.available - request.duration, used: balance.used + request.duration };
}

export function buildDecidedLeaveRequest(
  request: LeaveRequest,
  status: Extract<LeaveRequestStatus, "approved" | "rejected">,
  reviewedBy: string,
  reviewedAt: string,
  reviewNote?: string,
): LeaveRequest {
  return { ...request, status, reviewedBy, reviewedAt, reviewNote };
}

/**
 * The Gate 1 <-> Gate 2 integration point (§33): only an *approved* leave
 * request covering `date` explains what would otherwise look like an
 * unexplained absence — a pending or rejected request never does (§34),
 * proven directly by filtering on `status === "approved"` here rather
 * than trusting the caller to pre-filter.
 */
export function doesApprovedLeaveCoverDate(requests: LeaveRequest[], teamMemberId: string, date: string): boolean {
  return getLeaveRequestsForMember(requests, teamMemberId).some(
    (request) => request.status === "approved" && request.startDate <= date && date <= request.endDate,
  );
}
