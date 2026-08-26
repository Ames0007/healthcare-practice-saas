"use client";

import { useEffect, useState } from "react";
import { TeamPage } from "@/features/team/team-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-001/UI-002/UI-003A). */
const LOADING_SIMULATION_MS = 400;

/** Équipe — the real `/app/equipe` team directory screen (UI-007A), replacing the catch-all placeholder. */
export default function EquipeRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <TeamPage state={ready ? "loaded" : "loading"} />;
}
