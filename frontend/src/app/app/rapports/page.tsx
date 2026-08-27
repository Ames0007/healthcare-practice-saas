"use client";

import { useEffect, useState } from "react";
import { ReportsDashboard } from "@/features/rapports/reports-dashboard";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A/UI-008ABCD). */
const LOADING_SIMULATION_MS = 400;

/** Reports — Vue d'ensemble (UI-010ABC Gate 1) — replaces the generic Rapports placeholder at the module root. */
export default function ReportsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <ReportsDashboard state={ready ? "loaded" : "loading"} />;
}
