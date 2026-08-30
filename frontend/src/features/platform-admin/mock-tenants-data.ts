import type { Tenant } from "@/components/domain/platform-admin/types";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";

/**
 * Centralized synthetic Tenant directory (UI-013ABCDE Gate 2, Spec #4
 * §5.1). `tenant-1` is not a parallel fixture — its `name`/`specialty` are
 * read directly from the real `CabinetProfile` this whole prototype already
 * uses (`getCabinetProfileMockData`), so the platform directory's "own"
 * cabinet never silently drifts from what Cabinet Settings shows. The other
 * six are genuinely separate fixture tenants — five reuse the display names
 * already seeded by `features/referral/mock-referral-data.ts`
 * (`referredTenantName`, the only pre-existing "other cabinet" identities in
 * this codebase), plus one new tenant so every `TenantStatus` (`active`/
 * `suspended`/`closed`) and all seven CLAUDE.md specialties are exercised at
 * least once. Status/subscription pairing is deliberate fixture narrative,
 * never derived from one another (Spec #4 §57.7: "Never infer one domain
 * status solely from another").
 */
export function getTenantsMockData(): Tenant[] {
  const cabinetProfile = getCabinetProfileMockData();

  return [
    {
      id: "tenant-1",
      name: cabinetProfile.name,
      slug: "cabinet-exemple",
      specialty: cabinetProfile.specialty,
      city: cabinetProfile.city,
      status: "active",
      createdAt: "2026-02-23",
    },
    {
      id: "tenant-2",
      name: "Cabinet Atlas",
      slug: "cabinet-atlas",
      specialty: "dentistry",
      city: "Rabat",
      status: "active",
      createdAt: "2026-08-09",
    },
    {
      id: "tenant-3",
      name: "Cabinet Santé Plus",
      slug: "cabinet-sante-plus",
      specialty: "physiotherapy",
      city: "Marrakech",
      status: "active",
      createdAt: "2026-04-01",
    },
    {
      id: "tenant-4",
      name: "Cabinet Ennasr",
      slug: "cabinet-ennasr",
      specialty: "psychology",
      city: "Fès",
      status: "active",
      createdAt: "2025-08-23",
    },
    {
      id: "tenant-5",
      name: "Cabinet Riad Kiné",
      slug: "cabinet-riad-kine",
      specialty: "nutrition",
      city: "Agadir",
      status: "active",
      createdAt: "2025-11-23",
    },
    {
      id: "tenant-6",
      name: "Cabinet Zenith",
      slug: "cabinet-zenith",
      specialty: "dermatology",
      city: "Tanger",
      status: "suspended",
      createdAt: "2025-06-23",
    },
    {
      id: "tenant-7",
      name: "Cabinet Marrakech Multi",
      slug: "cabinet-marrakech-multi",
      specialty: "multi_practitioner",
      city: "Marrakech",
      status: "closed",
      createdAt: "2025-09-01",
    },
  ];
}
