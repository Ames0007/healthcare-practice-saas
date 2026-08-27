"use client";

import { useEffect, useState } from "react";
import { TemplatesPage } from "@/features/communication/templates-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A). */
const LOADING_SIMULATION_MS = 400;

/** Templates workspace (UI-009ABC Gate 2) — replaces the generic Communication placeholder. */
export default function CommunicationTemplatesRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <TemplatesPage state={ready ? "loaded" : "loading"} />;
}
