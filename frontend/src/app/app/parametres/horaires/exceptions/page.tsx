"use client";

import { useEffect, useState } from "react";
import { CalendarExceptionsPage } from "@/features/parametres/calendar-exceptions-page";

const LOADING_SIMULATION_MS = 400;

/** Paramètres — Horaires — Calendrier & exceptions (UI-AGENDA-X). */
export default function SettingsHorairesExceptionsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <CalendarExceptionsPage state={ready ? "loaded" : "loading"} />;
}
