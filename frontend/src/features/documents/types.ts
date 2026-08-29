import type { Locale } from "@/i18n/config";

export type GeneratedDocumentType = "invoice" | "receipt" | "prescription" | "payslip";

/**
 * Cabinet identity block every generated document renders (UI-DOCS-X §13) —
 * always resolved from the existing `CabinetProfile`/`DocumentSettings`
 * fixtures by the calling component, never a second cabinet fixture.
 */
export interface DocumentCabinetIdentity {
  name: string;
  address?: string;
  city?: string;
  phone: string;
  email?: string;
}

/** Shared descriptor every generated document carries (task §4). */
export interface GeneratedDocumentBase {
  type: GeneratedDocumentType;
  /** Human-facing reference reused verbatim from the source record — never a second numbering sequence (§15). */
  reference: string;
  title: string;
  filename: string;
  locale: Locale;
  /** Prototype-only generation timestamp (§7) — not a server-issued/certified date. */
  generatedAtPrototype: string;
  sourceRecordId: string;
  cabinet: DocumentCabinetIdentity;
  headerNote?: string;
  footerText: string;
}
