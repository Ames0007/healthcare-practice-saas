"use client";

import { useEffect, useState } from "react";
import { PlansPage } from "@/features/subscription/plans-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors every other UI-00X route). */
const LOADING_SIMULATION_MS = 400;

/** Plans (UI-011ABC Gate 2), `/app/abonnement/plans`. */
export default function PlansRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <PlansPage state={ready ? "loaded" : "loading"} />;
}
