import { CheckCircle2, FileEdit, type LucideIcon } from "lucide-react";
import type { StatusTone } from "@/components/ui/status-badge";
import type { ConsultationStatus } from "./types";

interface ConsultationStatusMeta {
  tone: StatusTone;
  translationKey: string;
  icon: LucideIcon;
}

/**
 * Consultation lifecycle status → tone/label registry (UI-005C §22),
 * mirroring `treatment-status.ts`/`session-status.ts`'s own small
 * per-domain registry pattern. `draft` is deliberately restrained
 * (`neutral`, same tone as `invoice-status.ts`'s own `draft`) — never
 * visually alarming (§22).
 */
export const CONSULTATION_STATUS_MAP: Record<ConsultationStatus, ConsultationStatusMeta> = {
  draft: { tone: "neutral", translationKey: "patientDetail.consultation.status.draft", icon: FileEdit },
  completed: { tone: "success", translationKey: "patientDetail.consultation.status.completed", icon: CheckCircle2 },
};
