"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PatientDetailPage } from "@/features/patients/patient-detail-page";

const LOADING_SIMULATION_MS = 400;

/** Rendez-vous tab route — real content (UI-004B): patient-specific upcoming/history appointments derived from Agenda's mock fixtures. */
export default function PatientAppointmentsRoutePage() {
  const { id } = useParams<{ id: string }>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return <PatientDetailPage patientId={id} activeTab="appointments" state={ready ? "loaded" : "loading"} />;
}
