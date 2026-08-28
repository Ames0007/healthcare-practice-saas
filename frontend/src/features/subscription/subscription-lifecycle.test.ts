import { describe, expect, it } from "vitest";
import {
  computeDaysBetween,
  computeDaysRemaining,
  GRACE_PERIOD_DAYS,
  EXPIRING_SOON_THRESHOLD_DAYS,
  isExpiringSoon,
} from "./subscription-lifecycle";

describe("subscription-lifecycle", () => {
  it("computeDaysBetween returns a positive count for a future date", () => {
    expect(computeDaysBetween("2026-08-23", "2026-09-23")).toBe(31);
  });

  it("computeDaysBetween returns a negative count for a past date", () => {
    expect(computeDaysBetween("2026-08-23", "2026-08-20")).toBe(-3);
  });

  it("computeDaysRemaining never goes negative once the target date has passed", () => {
    expect(computeDaysRemaining("2026-08-20", "2026-08-23")).toBe(0);
  });

  it("computeDaysRemaining matches the exact gap for a future date", () => {
    expect(computeDaysRemaining("2026-08-30", "2026-08-23")).toBe(7);
  });

  it("GRACE_PERIOD_DAYS is exactly 3 (Spec #2 §49.3)", () => {
    expect(GRACE_PERIOD_DAYS).toBe(3);
  });

  it("EXPIRING_SOON_THRESHOLD_DAYS is exactly 15 (Spec #2 §49.3's own D-15 reminder)", () => {
    expect(EXPIRING_SOON_THRESHOLD_DAYS).toBe(15);
  });

  it("isExpiringSoon is true within the 15-day window", () => {
    expect(isExpiringSoon("2026-09-01", "2026-08-23")).toBe(true);
  });

  it("isExpiringSoon is false beyond the 15-day window", () => {
    expect(isExpiringSoon("2026-09-23", "2026-08-23")).toBe(false);
  });

  it("isExpiringSoon is false once the date has already passed", () => {
    expect(isExpiringSoon("2026-08-20", "2026-08-23")).toBe(false);
  });
});
