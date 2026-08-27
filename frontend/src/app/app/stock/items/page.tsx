"use client";

import { useEffect, useState } from "react";
import { ItemsPage } from "@/features/stock/items-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A). */
const LOADING_SIMULATION_MS = 400;

/** Articles catalog (UI-008ABCD Gate 1) — replaces the generic Stock placeholder. */
export default function StockItemsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <ItemsPage state={ready ? "loaded" : "loading"} />;
}
