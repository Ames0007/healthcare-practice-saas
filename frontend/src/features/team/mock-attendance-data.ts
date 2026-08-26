import type { AttendanceRecord } from "@/components/domain/team/types";

/**
 * Centralized synthetic attendance fixtures (UI-007CDEF Gate 1) — the
 * business week immediately before `MOCK_BUSINESS_DATE` ("2026-08-23", a
 * Sunday — nobody in `mock-schedule-data.ts` works Sundays, so "today" is
 * correctly a rest day for the whole cabinet; this recent history is what
 * demonstrates every real attendance state). team-1 (Dr. Benali, split
 * shift) and team-3 (Meryem, single interval) each get one on-time day,
 * one late day, one early-departure day, one overtime day and one
 * genuinely absent day (no check-in on an expected work day) — covering
 * every `AttendanceStatus` this task requires (§25) for both the simple
 * and split-shift schedule shapes.
 */
export function getAttendanceMockData(): AttendanceRecord[] {
  return [
    // team-1 — Dr. Benali (split shift, Mon-Fri 08:30-12:30 + 14:30-18:30, Sat 08:30-12:30)
    { id: "att-team-1-1", teamMemberId: "team-1", businessDate: "2026-08-17", checkIn: "08:30", checkOut: "18:30" }, // on time
    { id: "att-team-1-2", teamMemberId: "team-1", businessDate: "2026-08-18", checkIn: "08:45", checkOut: "18:30" }, // late
    { id: "att-team-1-3", teamMemberId: "team-1", businessDate: "2026-08-19", checkIn: "08:30", checkOut: "18:45" }, // overtime
    // 2026-08-20: deliberately no record at all — genuinely absent (no check-in on an expected work day, §24).
    { id: "att-team-1-5", teamMemberId: "team-1", businessDate: "2026-08-21", checkIn: "08:30", checkOut: "18:30" }, // on time
    { id: "att-team-1-6", teamMemberId: "team-1", businessDate: "2026-08-22", checkIn: "08:35", checkOut: "12:30" }, // late (Saturday, single interval)

    // team-3 — Meryem Bakkali (single interval, Mon-Fri 08:00-16:00)
    { id: "att-team-3-1", teamMemberId: "team-3", businessDate: "2026-08-17", checkIn: "08:00", checkOut: "16:00" }, // on time
    { id: "att-team-3-2", teamMemberId: "team-3", businessDate: "2026-08-18", checkIn: "08:12", checkOut: "16:00" }, // late
    { id: "att-team-3-3", teamMemberId: "team-3", businessDate: "2026-08-19", checkIn: "08:00", checkOut: "15:45" }, // early departure
    { id: "att-team-3-4", teamMemberId: "team-3", businessDate: "2026-08-20", checkIn: "07:55", checkOut: "16:30" }, // overtime
    // 2026-08-21: deliberately no record at all — genuinely absent.
  ];
}
