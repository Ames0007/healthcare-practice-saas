"use client";

import { useEffect, useState } from "react";
import { ActivityReportPage } from "@/features/rapports/activity-report-page";

const LOADING_SIMULATION_MS = 400;

/** Reports — Activité (UI-010ABC Gate 1). */
export default function ReportsActivityRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <ActivityReportPage state={ready ? "loaded" : "loading"} />;
}
