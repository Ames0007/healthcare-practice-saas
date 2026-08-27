"use client";

import { useEffect, useState } from "react";
import { CommunicationDashboard } from "@/features/communication/communication-dashboard";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A). */
const LOADING_SIMULATION_MS = 400;

/** Communication dashboard (UI-009ABC Gate 3) — replaces the generic Communication placeholder at the module root. */
export default function CommunicationRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <CommunicationDashboard state={ready ? "loaded" : "loading"} />;
}
