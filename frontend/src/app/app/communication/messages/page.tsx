"use client";

import { useEffect, useState } from "react";
import { MessagesPage } from "@/features/communication/messages-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A). */
const LOADING_SIMULATION_MS = 400;

/** Message history workspace (UI-009ABC Gate 1) — replaces the generic Communication placeholder. */
export default function CommunicationMessagesRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <MessagesPage state={ready ? "loaded" : "loading"} />;
}
