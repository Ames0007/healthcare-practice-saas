"use client";

import { useEffect, useState } from "react";
import { TodayDashboard } from "@/features/today/today-dashboard";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (UI-001 §39). */
const LOADING_SIMULATION_MS = 500;

/**
 * Aujourd'hui — the real dashboard landing page for `/app` (UI-001).
 * Replaces the TASK-003 foundation/demo page.
 */
export default function AujourdhuiPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <TodayDashboard state={ready ? "loaded" : "loading"} />;
}
