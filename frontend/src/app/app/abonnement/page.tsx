"use client";

import { useEffect, useState } from "react";
import { SubscriptionPage } from "@/features/subscription/subscription-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors every other UI-00X route). */
const LOADING_SIMULATION_MS = 400;

/** Abonnement (UI-011ABC Gate 1) — replaces the generic catch-all placeholder at `/app/abonnement`. */
export default function SubscriptionRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <SubscriptionPage state={ready ? "loaded" : "loading"} />;
}
