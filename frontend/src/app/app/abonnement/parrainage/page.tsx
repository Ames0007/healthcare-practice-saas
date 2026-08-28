"use client";

import { useEffect, useState } from "react";
import { ReferralPage } from "@/features/referral/referral-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors every other UI-00X route). */
const LOADING_SIMULATION_MS = 400;

/** Parrainage (UI-011ABC Gate 3), `/app/abonnement/parrainage`. */
export default function ReferralRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <ReferralPage state={ready ? "loaded" : "loading"} />;
}
