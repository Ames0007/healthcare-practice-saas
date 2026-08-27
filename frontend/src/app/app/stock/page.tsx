"use client";

import { useEffect, useState } from "react";
import { StockDashboard } from "@/features/stock/stock-dashboard";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A). */
const LOADING_SIMULATION_MS = 400;

/** Pharmacie & Stock dashboard (UI-008ABCD Gate 4) — replaces the generic Stock placeholder at the module root. */
export default function StockRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <StockDashboard state={ready ? "loaded" : "loading"} />;
}
