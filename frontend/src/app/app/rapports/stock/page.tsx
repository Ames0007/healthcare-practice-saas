"use client";

import { useEffect, useState } from "react";
import { StockReportPage } from "@/features/rapports/stock-report-page";

const LOADING_SIMULATION_MS = 400;

/** Reports — Stock (UI-010ABC Gate 1). */
export default function ReportsStockRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <StockReportPage state={ready ? "loaded" : "loading"} />;
}
