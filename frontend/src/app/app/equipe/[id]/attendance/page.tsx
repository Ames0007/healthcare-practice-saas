"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TeamMemberDetailPage } from "@/features/team/team-member-detail-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A). */
const LOADING_SIMULATION_MS = 400;

/** Employee profile — Présence tab (UI-007CDEF Gate 1). */
export default function EquipeMemberAttendanceRoutePage() {
  const { id } = useParams<{ id: string }>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <TeamMemberDetailPage memberId={id} activeTab="attendance" state={ready ? "loaded" : "loading"} />;
}
