"use client";

import { useEffect, useState } from "react";
import { FinanceReportPage } from "@/features/rapports/finance-report-page";

const LOADING_SIMULATION_MS = 400;

/** Reports — Finance (UI-010ABC Gate 1). */
export default function ReportsFinanceRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <FinanceReportPage state={ready ? "loaded" : "loading"} />;
}
