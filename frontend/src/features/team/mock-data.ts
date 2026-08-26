import type { TeamMember } from "@/components/domain/team/types";
import { PRACTITIONERS } from "@/features/agenda/mock-data";

/**
 * Centralized synthetic team fixtures (UI-007A §15). `Dr. Youssef Benali`
 * and `Dr. Amal Idrissi` deliberately reuse the exact `id`s already
 * established by Agenda/Patients/Caisse's own lightweight `PRACTITIONERS`
 * fixture (`pr-1`/`pr-2`, first names "Dr. Benali"/"Dr. Amal" there) via
 * `practitionerId`, so the two representations never contradict each other
 * (§16). Every other name here was deliberately chosen to share no
 * first/last-name fragment with any seeded patient (`features/patients/mock-data.ts`)
 * or with these two practitioner identities, per §15's explicit collision
 * warning.
 */
export function getTeamMembersMockData(): TeamMember[] {
  return [
    {
      id: "team-1",
      employeeNumber: "EMP-0001",
      firstName: "Youssef",
      lastName: "Benali",
      role: "practitioner",
      professionalTitle: "Médecin",
      phone: "06 10 20 30 40",
      email: "y.benali@cabinet-exemple.test",
      startDate: "2019-03-01",
      status: "active",
      practitionerId: PRACTITIONERS[0].id,
    },
    {
      id: "team-2",
      employeeNumber: "EMP-0002",
      firstName: "Amal",
      lastName: "Idrissi",
      role: "practitioner",
      professionalTitle: "Médecin",
      phone: "06 11 22 33 44",
      email: "a.idrissi@cabinet-exemple.test",
      startDate: "2021-06-15",
      status: "active",
      practitionerId: PRACTITIONERS[1].id,
    },
    {
      id: "team-3",
      employeeNumber: "EMP-0003",
      firstName: "Meryem",
      lastName: "Bakkali",
      role: "receptionist",
      phone: "06 22 33 44 55",
      email: "meryem@cabinet-exemple.test",
      startDate: "2025-03-01",
      status: "active",
    },
    {
      id: "team-4",
      employeeNumber: "EMP-0004",
      firstName: "Nawal",
      lastName: "Chaoui",
      role: "assistant",
      phone: "06 33 44 55 66",
      email: "nawal.chaoui@cabinet-exemple.test",
      startDate: "2024-09-10",
      status: "active",
    },
    {
      id: "team-5",
      employeeNumber: "EMP-0005",
      firstName: "Hamza",
      lastName: "Rifai",
      role: "assistant",
      phone: "06 44 55 66 77",
      email: "hamza.rifai@cabinet-exemple.test",
      startDate: "2023-01-20",
      status: "active",
    },
    {
      id: "team-6",
      employeeNumber: "EMP-0006",
      firstName: "Khadija",
      lastName: "Ziani",
      role: "receptionist",
      phone: "06 55 66 77 88",
      email: "khadija.ziani@cabinet-exemple.test",
      startDate: "2022-05-02",
      status: "inactive",
    },
    {
      id: "team-7",
      employeeNumber: "EMP-0007",
      firstName: "Othmane",
      lastName: "Zouiten",
      role: "practitioner",
      professionalTitle: "Kinésithérapeute",
      phone: "06 66 77 88 99",
      email: "othmane.zouiten@cabinet-exemple.test",
      startDate: "2020-11-05",
      status: "inactive",
    },
    {
      id: "team-8",
      employeeNumber: "EMP-0008",
      firstName: "Ilham",
      lastName: "Mernissi",
      role: "assistant",
      phone: "06 77 88 99 00",
      email: "ilham.mernissi@cabinet-exemple.test",
      startDate: "2025-01-13",
      status: "active",
    },
  ];
}

/** Solo-cabinet empty state (UI-007A §17: "Solo empty state replaces table when no additional staff exists"). */
export function getEmptyTeamMembersMockData(): TeamMember[] {
  return [];
}
