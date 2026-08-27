"use client";

import { useEffect, useState } from "react";
import { HrReportPage } from "@/features/rapports/hr-report-page";

const LOADING_SIMULATION_MS = 400;

/** Reports — Équipe (UI-010ABC Gate 1). */
export default function ReportsEquipeRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <HrReportPage state={ready ? "loaded" : "loading"} />;
}
