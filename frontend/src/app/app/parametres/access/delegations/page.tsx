"use client";

import { useEffect, useState } from "react";
import { DelegationsPage } from "@/features/access/delegations-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors every other UI-00X route). */
const LOADING_SIMULATION_MS = 400;

/** Délégations (UI-011X Gate 3), `/app/parametres/access/delegations`. */
export default function AccessDelegationsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <DelegationsPage state={ready ? "loaded" : "loading"} />;
}
