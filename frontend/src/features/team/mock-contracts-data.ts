import type { EmploymentContract } from "@/components/domain/team/types";

/**
 * Centralized synthetic contract fixtures (UI-007B §21). Every
 * `teamMemberId` resolves to a real `getTeamMembersMockData()` entry
 * (proven by `mock-contracts-data.test.ts`). Deliberately covers all four
 * required scenarios: A. active open-ended (team-1/2/3/4), B. active
 * fixed-end (team-5/8), C. ended historical (team-6), D. no contract at
 * all (team-7 — reuses the same member UI-007A already established as
 * the "deliberately unlinked" outlier, rather than a new fixture, so the
 * no-contract empty state has no extra person to introduce). `jobTitle`
 * mirrors the linked `TeamMember.professionalTitle` where one exists
 * (§18) but remains its own field. No remuneration field anywhere (§20).
 */
export function getContractsMockData(): EmploymentContract[] {
  return [
    {
      id: "ctr-1",
      teamMemberId: "team-1",
      contractNumber: "CTR-2019-0001",
      contractType: "permanent",
      status: "active",
      startDate: "2019-03-01",
      jobTitle: "Médecin",
      weeklyHours: 44,
    },
    {
      id: "ctr-2",
      teamMemberId: "team-2",
      contractNumber: "CTR-2021-0001",
      contractType: "permanent",
      status: "active",
      startDate: "2021-06-15",
      jobTitle: "Médecin",
      weeklyHours: 44,
    },
    {
      id: "ctr-3",
      teamMemberId: "team-3",
      // Matches this task's own §16 example verbatim — Meryem Bakkali is
      // both EMP-0003 and this contract's own worked example.
      contractNumber: "CTR-2025-0003",
      contractType: "permanent",
      status: "active",
      startDate: "2025-03-01",
      jobTitle: "Réceptionniste",
      weeklyHours: 40,
    },
    {
      id: "ctr-4",
      teamMemberId: "team-4",
      contractNumber: "CTR-2024-0001",
      contractType: "part_time",
      status: "active",
      startDate: "2024-09-10",
      jobTitle: "Assistante",
      weeklyHours: 25,
    },
    {
      id: "ctr-5",
      teamMemberId: "team-5",
      contractNumber: "CTR-2023-0001",
      contractType: "fixed_term",
      status: "active",
      startDate: "2023-01-20",
      endDate: "2026-12-31",
      jobTitle: "Assistant",
      weeklyHours: 40,
    },
    {
      id: "ctr-6",
      teamMemberId: "team-6",
      contractNumber: "CTR-2022-0001",
      contractType: "permanent",
      status: "ended",
      startDate: "2022-05-02",
      endDate: "2026-06-30",
      jobTitle: "Réceptionniste",
      weeklyHours: 40,
    },
    {
      id: "ctr-8",
      teamMemberId: "team-8",
      contractNumber: "CTR-2025-0001",
      contractType: "internship",
      status: "active",
      startDate: "2025-01-13",
      endDate: "2026-12-31",
      jobTitle: "Assistante (stagiaire)",
      weeklyHours: 35,
    },
    // team-7 (Othmane Zouiten) deliberately has no contract (§21D).
  ];
}
