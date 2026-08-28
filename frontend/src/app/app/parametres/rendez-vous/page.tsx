"use client";

import { useEffect, useState } from "react";
import { AppointmentSettingsPage } from "@/features/parametres/appointment-settings-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-010ABC's own settings routes). */
const LOADING_SIMULATION_MS = 400;

/** Paramètres — Rendez-vous (UI-010BC Gate 2). */
export default function RendezVousSettingsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <AppointmentSettingsPage state={ready ? "loaded" : "loading"} />;
}
