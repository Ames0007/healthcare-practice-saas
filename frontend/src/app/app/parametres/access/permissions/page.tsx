"use client";

import { useEffect, useState } from "react";
import { PermissionsPage } from "@/features/access/permissions-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors every other UI-00X route). */
const LOADING_SIMULATION_MS = 400;

/** Permissions (UI-011X Gate 1), `/app/parametres/access/permissions`. */
export default function AccessPermissionsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <PermissionsPage state={ready ? "loaded" : "loading"} />;
}
