"use client";

import { useEffect, useState } from "react";
import { TeamLeaveCalendarPage } from "@/features/team/team-leave-calendar-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-001/UI-002/UI-003A). */
const LOADING_SIMULATION_MS = 400;

/**
 * Cabinet-level Leave Agenda (UI-LEAVE-X), at `/app/equipe/leave-calendar`
 * — a static sibling of `/app/equipe/[id]`, mirroring `attendance/page.tsx`'s
 * exact precedent. Next.js resolves a static route segment before ever
 * considering a dynamic sibling, so this route can never be misread as a
 * TeamMember id by `[id]/page.tsx` (see `team-routing.test.ts`).
 */
export default function EquipeLeaveCalendarRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <TeamLeaveCalendarPage state={ready ? "loaded" : "loading"} />;
}
