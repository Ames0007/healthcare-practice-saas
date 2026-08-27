"use client";

import { useEffect, useState } from "react";
import { AutomationsPage } from "@/features/communication/automations-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A). */
const LOADING_SIMULATION_MS = 400;

/** Automations workspace (UI-009ABC Gate 2) — replaces the generic Communication placeholder. */
export default function CommunicationAutomationsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <AutomationsPage state={ready ? "loaded" : "loading"} />;
}
