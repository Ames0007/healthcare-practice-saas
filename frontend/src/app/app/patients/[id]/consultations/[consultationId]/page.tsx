"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ConsultationWorkspacePage } from "@/features/patients/consultation-workspace-page";

const LOADING_SIMULATION_MS = 400;

/** Active consultation workspace route (UI-005C) — independently addressable, preserving patient context internally rather than via the Patient 360° tab shell. */
export default function ConsultationWorkspaceRoutePage() {
  const { id, consultationId } = useParams<{ id: string; consultationId: string }>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_SIMULATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ConsultationWorkspacePage patientId={id} consultationId={consultationId} state={ready ? "loaded" : "loading"} />
  );
}
