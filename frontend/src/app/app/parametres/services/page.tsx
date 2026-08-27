"use client";

import { useEffect, useState } from "react";
import { ServicesPage } from "@/features/parametres/services-page";

const LOADING_SIMULATION_MS = 400;

/** Paramètres — Services & tarifs (UI-010ABC Gate 3). */
export default function SettingsServicesRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <ServicesPage state={ready ? "loaded" : "loading"} />;
}
