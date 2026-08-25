/**
 * Re-export barrel (mirrors `features/patients/format.ts`'s own re-export of
 * `formatMad` from `features/today/format.ts`) — one canonical money/date
 * formatter set, never a second incompatible copy (UI-006A §4).
 */
export { formatMad, formatBusinessDate } from "@/features/today/format";
export { formatDayMonth, formatDayMonthYear } from "@/features/patients/format";
