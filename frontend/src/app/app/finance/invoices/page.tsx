"use client";

import { useEffect, useState } from "react";
import { GlobalInvoicesPage } from "@/features/finance/global-invoices-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-001/UI-002/UI-006A). */
const LOADING_SIMULATION_MS = 400;

/** Global Invoices & Receivables landing page for `/app/finance/invoices` (UI-006B). */
export default function FinanceInvoices() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <GlobalInvoicesPage state={ready ? "loaded" : "loading"} />;
}
