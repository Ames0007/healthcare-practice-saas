"use client";

import { useEffect, useState } from "react";
import { CaissePage } from "@/features/caisse/caisse-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-001/UI-002/UI-006A/B). */
const LOADING_SIMULATION_MS = 400;

/** Caisse landing page for `/app/finance/caisse` (UI-006C). */
export default function FinanceCaisse() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <CaissePage state={ready ? "loaded" : "loading"} />;
}
