"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PatientDetailPage } from "@/features/patients/patient-detail-page";

const LOADING_SIMULATION_MS = 400;

/** Paiements tab route — real header/tabs/content (UI-004A §24 shell, UI-004E content). */
export default function PatientPaymentsRoutePage() {
  const { id } = useParams<{ id: string }>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <PatientDetailPage patientId={id} activeTab="payments" state={ready ? "loaded" : "loading"} />;
}
