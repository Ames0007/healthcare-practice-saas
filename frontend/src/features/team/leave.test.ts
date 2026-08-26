import { describe, expect, it } from "vitest";
import type { LeaveBalance, LeaveRequest } from "@/components/domain/team/types";
import {
  applyApprovedLeaveToBalance,
  buildDecidedLeaveRequest,
  computeLeaveDurationDays,
  computePendingDays,
  doesApprovedLeaveCoverDate,
  getLeaveBalance,
  getLeaveRequestsForMember,
  isValidLeaveDateRange,
} from "./leave";

const pending: LeaveRequest = {
  id: "lr-1",
  teamMemberId: "m-1",
  leaveType: "annual",
  startDate: "2026-09-04",
  endDate: "2026-09-05",
  duration: 2,
  status: "pending",
  requestedAt: "2026-08-20",
};

const approved: LeaveRequest = {
  id: "lr-2",
  teamMemberId: "m-1",
  leaveType: "other",
  startDate: "2026-08-25",
  endDate: "2026-08-25",
  duration: 1,
  status: "approved",
  requestedAt: "2026-08-15",
  reviewedBy: "Owner",
  reviewedAt: "2026-08-16",
};

const rejected: LeaveRequest = {
  id: "lr-3",
  teamMemberId: "m-1",
  leaveType: "sick",
  startDate: "2026-07-01",
  endDate: "2026-07-02",
  duration: 2,
  status: "rejected",
  requestedAt: "2026-06-25",
};

describe("computeLeaveDurationDays", () => {
  it("matches the task's own worked example (26-28 août = 3 jours, §30)", () => {
    expect(computeLeaveDurationDays("2026-08-26", "2026-08-28")).toBe(3);
  });

  it("is 1 for a single day", () => {
    expect(computeLeaveDurationDays("2026-08-25", "2026-08-25")).toBe(1);
  });

  it("does not invent weekend/holiday exclusions — every calendar day counts", () => {
    // 2026-09-04 is a Friday, 2026-09-05 a Saturday — both count.
    expect(computeLeaveDurationDays("2026-09-04", "2026-09-05")).toBe(2);
  });
});

describe("isValidLeaveDateRange", () => {
  it("accepts an end date equal to or after the start date (§31 — same-day leave is valid)", () => {
    expect(isValidLeaveDateRange("2026-08-25", "2026-08-25")).toBe(true);
    expect(isValidLeaveDateRange("2026-08-25", "2026-08-27")).toBe(true);
  });

  it("rejects an end date before the start date, or an empty field", () => {
    expect(isValidLeaveDateRange("2026-08-27", "2026-08-25")).toBe(false);
    expect(isValidLeaveDateRange("", "2026-08-25")).toBe(false);
    expect(isValidLeaveDateRange("2026-08-25", "")).toBe(false);
  });
});

describe("computePendingDays (§35)", () => {
  it("sums only pending requests of the given type for the given member", () => {
    expect(computePendingDays([pending, approved, rejected], "m-1", "annual")).toBe(2);
  });

  it("never counts an approved or rejected request as pending", () => {
    expect(computePendingDays([approved, rejected], "m-1", "other")).toBe(0);
    expect(computePendingDays([approved, rejected], "m-1", "sick")).toBe(0);
  });

  it("is zero for a member with no requests at all", () => {
    expect(computePendingDays([pending], "m-does-not-exist", "annual")).toBe(0);
  });
});

describe("getLeaveRequestsForMember", () => {
  it("filters to only the given member, newest-requested first", () => {
    const other: LeaveRequest = { ...pending, id: "lr-other", teamMemberId: "m-2" };
    expect(getLeaveRequestsForMember([pending, other, approved], "m-1").map((r) => r.id)).toEqual(["lr-1", "lr-2"]);
  });
});

describe("applyApprovedLeaveToBalance (§35 — approved moves available -> used)", () => {
  it("decreases available and increases used by exactly the request's own duration", () => {
    const balance: LeaveBalance = { teamMemberId: "m-1", leaveType: "annual", available: 18, used: 4 };
    expect(applyApprovedLeaveToBalance(balance, pending)).toEqual({ teamMemberId: "m-1", leaveType: "annual", available: 16, used: 6 });
  });
});

describe("buildDecidedLeaveRequest", () => {
  it("sets status/reviewer/timestamp without touching the request's own dates or duration", () => {
    const decided = buildDecidedLeaveRequest(pending, "approved", "Owner", "2026-08-21");
    expect(decided.status).toBe("approved");
    expect(decided.reviewedBy).toBe("Owner");
    expect(decided.startDate).toBe(pending.startDate);
    expect(decided.duration).toBe(pending.duration);
  });

  it("carries an optional review note for a rejection", () => {
    const decided = buildDecidedLeaveRequest(pending, "rejected", "Owner", "2026-08-21", "Effectif insuffisant.");
    expect(decided.reviewNote).toBe("Effectif insuffisant.");
  });
});

describe("doesApprovedLeaveCoverDate (§33 — the Gate 1 <-> Gate 2 integration point)", () => {
  it("is true for a date inside an approved request's own range", () => {
    expect(doesApprovedLeaveCoverDate([approved], "m-1", "2026-08-25")).toBe(true);
  });

  it("is false for a date outside the range, or for the wrong member", () => {
    expect(doesApprovedLeaveCoverDate([approved], "m-1", "2026-08-26")).toBe(false);
    expect(doesApprovedLeaveCoverDate([approved], "m-2", "2026-08-25")).toBe(false);
  });

  it("is false for a pending request covering the exact same date (§34 — pending never excuses absence)", () => {
    const pendingSameDate: LeaveRequest = { ...pending, startDate: "2026-08-25", endDate: "2026-08-25" };
    expect(doesApprovedLeaveCoverDate([pendingSameDate], "m-1", "2026-08-25")).toBe(false);
  });

  it("is false for a rejected request covering the exact same date", () => {
    const rejectedSameDate: LeaveRequest = { ...rejected, startDate: "2026-08-25", endDate: "2026-08-25" };
    expect(doesApprovedLeaveCoverDate([rejectedSameDate], "m-1", "2026-08-25")).toBe(false);
  });
});

describe("getLeaveBalance", () => {
  it("finds the exact member+type balance, or null", () => {
    const balances: LeaveBalance[] = [{ teamMemberId: "m-1", leaveType: "annual", available: 18, used: 4 }];
    expect(getLeaveBalance(balances, "m-1", "annual")?.available).toBe(18);
    expect(getLeaveBalance(balances, "m-1", "sick")).toBeNull();
  });
});
