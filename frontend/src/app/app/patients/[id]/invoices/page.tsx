"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PatientDetailPage } from "@/features/patients/patient-detail-page";

const LOADING_SIMULATION_MS = 400;

/** Factures tab route — placeholder content, real header/tabs (UI-004A §24). UI-007 owns the real content. */
export default function PatientInvoicesRoutePage() {
  const { id } = useParams<{ id: string }>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <PatientDetailPage patientId={id} activeTab="invoices" state={ready ? "loaded" : "loading"} />;
}
