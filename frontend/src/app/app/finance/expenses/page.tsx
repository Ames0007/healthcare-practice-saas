"use client";

import { useEffect, useState } from "react";
import { ExpensesPage } from "@/features/finance/expenses-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-001/UI-002/UI-006A/B/C). */
const LOADING_SIMULATION_MS = 400;

/** Décaissements & Expenses landing page for `/app/finance/expenses` (UI-006D). */
export default function FinanceExpenses() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <ExpensesPage state={ready ? "loaded" : "loading"} />;
}
