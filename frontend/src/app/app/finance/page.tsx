"use client";

import { useEffect, useState } from "react";
import { FinanceDashboard } from "@/features/finance/finance-dashboard";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-001/UI-002). */
const LOADING_SIMULATION_MS = 400;

/** Cabinet Finance dashboard landing page for `/app/finance` (UI-006A), replacing the generic "not implemented" placeholder. */
export default function Finance() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <FinanceDashboard state={ready ? "loaded" : "loading"} />;
}
