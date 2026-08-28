"use client";

import { useEffect, useState } from "react";
import { RolesPage } from "@/features/access/roles-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors every other UI-00X route). */
const LOADING_SIMULATION_MS = 400;

/** Rôles (UI-011X Gate 1), `/app/parametres/access/roles`. */
export default function AccessRolesRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <RolesPage state={ready ? "loaded" : "loading"} />;
}
