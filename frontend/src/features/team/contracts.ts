import type { EmploymentContract } from "@/components/domain/team/types";

export function getContractsForMember(contracts: EmploymentContract[], teamMemberId: string): EmploymentContract[] {
  return contracts.filter((contract) => contract.teamMemberId === teamMemberId);
}

/**
 * The employee's current contract (UI-007B §22) — no contract versioning
 * UI, just "which one is relevant right now": the active one if there is
 * one, otherwise the most recently started historical contract, otherwise
 * `null` (§21D's deliberate no-contract fixture scenario).
 */
export function getCurrentContract(contracts: EmploymentContract[], teamMemberId: string): EmploymentContract | null {
  const memberContracts = getContractsForMember(contracts, teamMemberId);
  if (memberContracts.length === 0) return null;

  const active = memberContracts.find((contract) => contract.status === "active");
  if (active) return active;

  return [...memberContracts].sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0];
}

/** ISO `yyyy-mm-dd` strings compare correctly with plain string comparison — an end date must be strictly after the start date. */
export function isValidContractDateRange(startDate: string, endDate: string): boolean {
  if (!endDate) return true;
  return endDate > startDate;
}

/** Whole or one-decimal contractual hours only — never used to derive pay (§19/§20). */
export function isValidWeeklyHours(value: string): boolean {
  if (value.trim() === "") return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 60;
}
