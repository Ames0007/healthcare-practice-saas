"use client";

import { useEffect, useState } from "react";
import { PaymentMethodsPage } from "@/features/parametres/payment-methods-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-010ABC's own settings routes). */
const LOADING_SIMULATION_MS = 400;

/** Paramètres — Paiements (UI-010BC Gate 2). */
export default function PaiementsSettingsRoutePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <PaymentMethodsPage state={ready ? "loaded" : "loading"} />;
}
