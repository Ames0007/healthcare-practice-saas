"use client";

import { useEffect, useState } from "react";
import { CabinetSettingsPage } from "@/features/parametres/cabinet-settings-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A/UI-008ABCD). */
const LOADING_SIMULATION_MS = 400;

/** Paramètres — Cabinet (UI-010ABC Gate 2) — replaces the generic Paramètres placeholder at the module root. */
export default function SettingsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <CabinetSettingsPage state={ready ? "loaded" : "loading"} />;
}
