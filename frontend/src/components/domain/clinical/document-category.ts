import { File, FileText, FlaskConical, Image, Pill, type LucideIcon } from "lucide-react";
import type { ClinicalDocumentCategory } from "./types";

interface DocumentCategoryMeta {
  translationKey: string;
  icon: LucideIcon;
}

/**
 * Centralized category → label/icon mapping (UI-005D §10) — never
 * hardcoded per card. Lucide icons only, no emoji, no per-category color
 * treatment (a document's category is informational, not a status).
 */
export const DOCUMENT_CATEGORY_MAP: Record<ClinicalDocumentCategory, DocumentCategoryMeta> = {
  analysis: { translationKey: "patientDetail.health.documents.category.analysis", icon: FlaskConical },
  imaging: { translationKey: "patientDetail.health.documents.category.imaging", icon: Image },
  report: { translationKey: "patientDetail.health.documents.category.report", icon: FileText },
  prescription: { translationKey: "patientDetail.health.documents.category.prescription", icon: Pill },
  other: { translationKey: "patientDetail.health.documents.category.other", icon: File },
};
