"use client";

import { useEffect, useState } from "react";
import { NumberingPage } from "@/features/parametres/numbering-page";

const LOADING_SIMULATION_MS = 400;

/** Paramètres — Numérotation (UI-010ABC Gate 3). */
export default function SettingsNumberingRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <NumberingPage state={ready ? "loaded" : "loading"} />;
}
