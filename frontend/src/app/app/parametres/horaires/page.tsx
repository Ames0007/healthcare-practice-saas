"use client";

import { useEffect, useState } from "react";
import { WorkingHoursPage } from "@/features/parametres/working-hours-page";

const LOADING_SIMULATION_MS = 400;

/** Paramètres — Horaires (UI-010ABC Gate 3). */
export default function SettingsHorairesRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <WorkingHoursPage state={ready ? "loaded" : "loading"} />;
}
