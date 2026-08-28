"use client";

import { useEffect, useState } from "react";
import { HistoriquePage } from "@/features/access/historique-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors every other UI-00X route). */
const LOADING_SIMULATION_MS = 400;

/** Historique (UI-011X Gate 4), `/app/parametres/access/historique`. */
export default function AccessHistoriqueRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <HistoriquePage state={ready ? "loaded" : "loading"} />;
}
