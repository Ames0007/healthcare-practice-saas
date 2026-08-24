"use client";

import { useEffect, useState } from "react";
import { AgendaPage } from "@/features/agenda/agenda-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (UI-002 §64). */
const LOADING_SIMULATION_MS = 400;

/** Agenda & appointment prototype landing page for `/app/agenda` (UI-002). */
export default function Agenda() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <AgendaPage state={ready ? "loaded" : "loading"} />;
}
