"use client";

import { useEffect, useState } from "react";
import { StockMovementsPage } from "@/features/stock/stock-movements-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A). */
const LOADING_SIMULATION_MS = 400;

/** Stock Movements cabinet workspace (UI-008ABCD Gate 3). */
export default function StockMovementsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <StockMovementsPage state={ready ? "loaded" : "loading"} />;
}
