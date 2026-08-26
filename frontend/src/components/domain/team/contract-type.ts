import { Briefcase, CalendarClock, Clock3, GraduationCap, FileQuestion, type LucideIcon } from "lucide-react";
import type { ContractType } from "./types";

interface ContractTypeMeta {
  translationKey: string;
  icon: LucideIcon;
}

/**
 * Central contract type -> label/icon registry (UI-007B §13), mirroring
 * `team-role.ts`'s pattern. Contract type is not a status — no
 * `StatusTone` here (§13: "do not assign arbitrary status colors by
 * contract type").
 */
export const CONTRACT_TYPE_MAP: Record<ContractType, ContractTypeMeta> = {
  permanent: { translationKey: "team.contractType.permanent", icon: Briefcase },
  fixed_term: { translationKey: "team.contractType.fixedTerm", icon: CalendarClock },
  part_time: { translationKey: "team.contractType.partTime", icon: Clock3 },
  internship: { translationKey: "team.contractType.internship", icon: GraduationCap },
  other: { translationKey: "team.contractType.other", icon: FileQuestion },
};
