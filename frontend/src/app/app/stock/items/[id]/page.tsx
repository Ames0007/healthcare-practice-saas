"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ItemDetailPage } from "@/features/stock/item-detail-page";

/** Manual-review-only prototype loading simulation — there is no real fetch yet (mirrors UI-004A). */
const LOADING_SIMULATION_MS = 400;

/** Item 360° — Aperçu tab (UI-008ABCD Gate 1). */
export default function StockItemDetailRoutePage() {
  const { id } = useParams<{ id: string }>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <ItemDetailPage itemId={id} activeTab="overview" state={ready ? "loaded" : "loading"} />;
}
