"use client";

import { useEffect, useState } from "react";
import { PatientsPage } from "@/features/patients/patients-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-001/UI-002). */
const LOADING_SIMULATION_MS = 400;

/** Patients — the real `/app/patients` list screen (UI-003A), replacing the catch-all placeholder. */
export default function PatientsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <PatientsPage state={ready ? "loaded" : "loading"} />;
}
