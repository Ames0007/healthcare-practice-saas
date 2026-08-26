"use client";

import { useEffect, useState } from "react";
import { TeamAttendancePage } from "@/features/team/team-attendance-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-001/UI-002/UI-003A). */
const LOADING_SIMULATION_MS = 400;

/** Cabinet-level attendance workspace (UI-007CDEF §22), at `/app/equipe/attendance`. */
export default function EquipeAttendanceRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <TeamAttendancePage state={ready ? "loaded" : "loading"} />;
}
