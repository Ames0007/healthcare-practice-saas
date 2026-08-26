import type { LeaveBalance, LeaveRequest } from "@/components/domain/team/types";

/**
 * Centralized synthetic leave fixtures (UI-007CDEF Gate 2). Meryem Bakkali
 * (team-3) demonstrates all three request statuses and the Gate 1 <->
 * Gate 2 attendance integration (§33): her approved request covers
 * 2026-08-25, a date with no attendance record of its own, deliberately
 * distinct from every date already used by Gate 1's own attendance/absent
 * test fixtures, so wiring leave into attendance never changes an
 * existing, already-tested Gate 1 result. Dr. Benali (team-1) gets one
 * more approved request for variety. Nawal Chaoui (team-4) deliberately
 * has none at all — the empty-state demo.
 */
export function getLeaveRequestsMockData(): LeaveRequest[] {
  return [
    {
      id: "lr-1",
      teamMemberId: "team-3",
      leaveType: "annual",
      // Matches this task's own §30 worked example almost exactly ("26-28 août... 3 jours").
      startDate: "2026-09-04",
      endDate: "2026-09-05",
      duration: 2,
      status: "pending",
      requestedAt: "2026-08-20",
    },
    {
      id: "lr-2",
      teamMemberId: "team-3",
      leaveType: "other",
      startDate: "2026-08-25",
      endDate: "2026-08-25",
      duration: 1,
      status: "approved",
      requestedAt: "2026-08-15",
      reviewedBy: "Youssef Benali",
      reviewedAt: "2026-08-16",
    },
    {
      id: "lr-3",
      teamMemberId: "team-3",
      leaveType: "sick",
      startDate: "2026-07-01",
      endDate: "2026-07-02",
      duration: 2,
      status: "rejected",
      requestedAt: "2026-06-25",
      reviewedBy: "Youssef Benali",
      reviewedAt: "2026-06-26",
      reviewNote: "Effectif insuffisant ce jour-là.",
    },
    {
      id: "lr-4",
      teamMemberId: "team-1",
      leaveType: "annual",
      startDate: "2026-07-05",
      endDate: "2026-07-06",
      duration: 2,
      status: "approved",
      requestedAt: "2026-06-20",
      reviewedBy: "Youssef Benali",
      reviewedAt: "2026-06-21",
    },
    // team-4 (Nawal Chaoui) deliberately has no leave requests at all.
  ];
}

/** Annual leave only is balance-tracked in this prototype — sick/unpaid/other requests can still be submitted without a numeric balance constraint (documented decision). */
export function getLeaveBalancesMockData(): LeaveBalance[] {
  return [
    { teamMemberId: "team-1", leaveType: "annual", available: 20, used: 2 },
    { teamMemberId: "team-3", leaveType: "annual", available: 18, used: 4 },
  ];
}
