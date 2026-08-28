"use client";

import { useEffect, useState } from "react";
import { UsersPage } from "@/features/access/users-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors every other UI-00X route). */
const LOADING_SIMULATION_MS = 400;

/** Utilisateurs (UI-011X Gate 2) — root of Accès & permissions, `/app/parametres/access`. */
export default function AccessUsersRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <UsersPage state={ready ? "loaded" : "loading"} />;
}
