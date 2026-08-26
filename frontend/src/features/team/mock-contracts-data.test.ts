import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "./mock-data";
import { getContractsMockData } from "./mock-contracts-data";
import { getCurrentContract } from "./contracts";

describe("getContractsMockData fixture integrity (UI-007B §21)", () => {
  it("every contract's teamMemberId resolves to a real TeamMember", () => {
    const members = getTeamMembersMockData();
    const memberIds = new Set(members.map((member) => member.id));

    for (const contract of getContractsMockData()) {
      expect(memberIds.has(contract.teamMemberId)).toBe(true);
    }
  });

  it("has unique contract ids and unique contract numbers", () => {
    const contracts = getContractsMockData();
    expect(new Set(contracts.map((contract) => contract.id)).size).toBe(contracts.length);

    const numbers = contracts.map((contract) => contract.contractNumber).filter(Boolean);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("carries no remuneration field anywhere (§20)", () => {
    for (const contract of getContractsMockData()) {
      expect(contract).not.toHaveProperty("salary");
      expect(contract).not.toHaveProperty("hourlyRate");
      expect(contract).not.toHaveProperty("baseSalary");
    }
  });

  it("covers all four required scenarios (§21 A-D)", () => {
    const contracts = getContractsMockData();
    const members = getTeamMembersMockData();

    const activeOpenEnded = contracts.some((contract) => contract.status === "active" && !contract.endDate);
    const activeFixedEnd = contracts.some((contract) => contract.status === "active" && Boolean(contract.endDate));
    const endedHistorical = contracts.some((contract) => contract.status === "ended");
    const memberWithNoContract = members.some(
      (member) => !contracts.some((contract) => contract.teamMemberId === member.id),
    );

    expect(activeOpenEnded).toBe(true);
    expect(activeFixedEnd).toBe(true);
    expect(endedHistorical).toBe(true);
    expect(memberWithNoContract).toBe(true);
  });

  it("resolves a real current contract for every member that has one, via getCurrentContract", () => {
    const contracts = getContractsMockData();
    const contractedMemberIds = new Set(contracts.map((contract) => contract.teamMemberId));

    for (const memberId of contractedMemberIds) {
      expect(getCurrentContract(contracts, memberId)).not.toBeNull();
    }
  });
});
