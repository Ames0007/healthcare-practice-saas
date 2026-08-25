"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { DOCUMENT_CATEGORY_MAP } from "@/components/domain/clinical/document-category";
import type { ClinicalDocument } from "@/components/domain/clinical/types";
import { getClinicalDocumentsMockData } from "@/features/patients/mock-clinical-documents-data";
import {
  getDocumentsForPatient,
  matchesDocumentFilter,
  sortDocumentsDesc,
  type DocumentFilterGroup,
} from "@/features/patients/clinical-documents";
import { formatDayMonthYear, formatFileSize } from "@/features/patients/format";
import { DocumentDetailDrawer } from "./document-detail-drawer";
import { DocumentUploadDialog } from "./document-upload-dialog";

const FILTER_ORDER: DocumentFilterGroup[] = ["all", "analysis", "imaging", "report", "prescription", "other"];

export interface DocumentsSectionProps {
  patientId: string;
  practitionerName: string;
  /** Prototype seam for tests (mirrors `ClinicalHistorySection`'s own `encounters` prop) — defaults to the centralized mock documents. */
  documents?: ClinicalDocument[];
}

/**
 * Documents section (UI-005D §7/§11-14) — sits inside Dossier Santé,
 * below Historique clinique, not a seventh Patient 360° tab (§6). A newly
 * uploaded document lives only in this component's own local state (the
 * same "local session state, not a global store" convention as every
 * prior Dossier Santé prototype interaction) — no LocalStorage/
 * IndexedDB/cookie, and the centralized fixtures are never mutated.
 */
export function DocumentsSection({ patientId, practitionerName, documents: providedDocuments }: DocumentsSectionProps) {
  const { t, locale } = useLocale();
  const [filter, setFilter] = useState<DocumentFilterGroup>("all");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [localDocuments, setLocalDocuments] = useState<ClinicalDocument[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const seedDocuments = getDocumentsForPatient(providedDocuments ?? getClinicalDocumentsMockData(), patientId);
  const allDocuments = sortDocumentsDesc([...seedDocuments, ...localDocuments]);
  const filteredDocuments = allDocuments.filter((document) => matchesDocumentFilter(document, filter));
  const selectedDocument = allDocuments.find((document) => document.id === selectedDocumentId) ?? null;

  function handleUploadSuccess(document: ClinicalDocument) {
    setLocalDocuments((current) => [...current, document]);
    setUploadOpen(false);
    setToastMessage(t("patientDetail.health.documents.documentAdded"));
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("patientDetail.health.documents.title")}
        </h2>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          {t("patientDetail.health.documents.addButton")}
        </Button>
      </div>

      {allDocuments.length === 0 ? (
        <EmptyState
          title={t("patientDetail.health.documents.emptyTitle")}
          description={t("patientDetail.health.documents.emptyDescription")}
          primaryAction={
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              {t("patientDetail.health.documents.emptyAction")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex flex-wrap items-center gap-1 rounded-md border border-border-strong p-1"
              role="group"
              aria-label={t("patientDetail.health.documents.title")}
            >
              {FILTER_ORDER.map((group) => (
                <Button
                  key={group}
                  type="button"
                  variant={filter === group ? "primary" : "ghost"}
                  size="sm"
                  aria-pressed={filter === group}
                  onClick={() => setFilter(group)}
                >
                  {t(`patientDetail.health.documents.filters.${group}`)}
                </Button>
              ))}
            </div>
            <p className="text-sm text-text-muted" aria-live="polite">
              {t("patientDetail.health.documents.resultCount", { count: filteredDocuments.length })}
            </p>
          </div>

          {filteredDocuments.length === 0 ? (
            <p className="text-sm text-text-muted">{t("patientDetail.health.documents.filteredEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredDocuments.map((document) => {
                const categoryMeta = DOCUMENT_CATEGORY_MAP[document.category];
                const Icon = categoryMeta.icon;
                return (
                  <li key={document.id}>
                    <Card className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text">{document.title}</p>
                          <p className="text-xs text-text-muted">
                            {t(categoryMeta.translationKey)} ·{" "}
                            <span dir="ltr">{formatDayMonthYear(document.uploadedAt, locale)}</span> ·{" "}
                            <span dir="ltr">{formatFileSize(document.sizeBytes, locale)}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setSelectedDocumentId(document.id)}
                      >
                        {t("patientDetail.health.documents.viewButton")}
                      </Button>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <DocumentDetailDrawer
        document={selectedDocument}
        open={selectedDocument !== null}
        onClose={() => setSelectedDocumentId(null)}
        onFutureFeature={(message) => setToastMessage(message)}
      />
      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        patientId={patientId}
        practitionerName={practitionerName}
        existingCount={allDocuments.length}
        onSuccess={handleUploadSuccess}
      />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
