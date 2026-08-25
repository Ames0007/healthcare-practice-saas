"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DOCUMENT_CATEGORY_MAP } from "@/components/domain/clinical/document-category";
import type { ClinicalDocument } from "@/components/domain/clinical/types";
import { formatDayMonthYear, formatFileSize } from "@/features/patients/format";

export interface DocumentDetailDrawerProps {
  document: ClinicalDocument | null;
  open: boolean;
  onClose: () => void;
  onFutureFeature: (message: string) => void;
}

/**
 * Read-only clinical-document detail (Spec #9 Screen 21, UI-005D §14).
 * "Télécharger" is a prototype affordance only — never generates or
 * downloads a real file (§15); no "Supprimer" anywhere, a historical
 * clinical document requires governed lifecycle/audit behavior (§24).
 */
export function DocumentDetailDrawer({ document: clinicalDocument, open, onClose, onFutureFeature }: DocumentDetailDrawerProps) {
  const { t, locale } = useLocale();

  if (!clinicalDocument) {
    return null;
  }

  const categoryMeta = DOCUMENT_CATEGORY_MAP[clinicalDocument.category];

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={clinicalDocument.title} closeLabel={t("agenda.drawer.close")}>
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-text">{clinicalDocument.title}</h2>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.documents.categoryLabel")}
          </p>
          <p className="text-sm text-text">{t(categoryMeta.translationKey)}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.documents.uploadedAtLabel")}
          </p>
          <p className="text-sm text-text" dir="ltr">
            {formatDayMonthYear(clinicalDocument.uploadedAt, locale)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.documents.uploadedByLabel")}
          </p>
          <p className="text-sm text-text">{clinicalDocument.uploadedBy}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.documents.fileLabel")}
          </p>
          <p className="text-sm text-text" dir="ltr">
            {clinicalDocument.fileName}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.documents.sizeLabel")}
          </p>
          <p className="text-sm text-text" dir="ltr">
            {formatFileSize(clinicalDocument.sizeBytes, locale)}
          </p>
        </div>

        {clinicalDocument.description && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("patientDetail.health.documents.descriptionLabel")}
            </p>
            <p className="text-sm text-text">{clinicalDocument.description}</p>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFutureFeature(t("patientDetail.health.documents.downloadNotice"))}
          >
            {t("patientDetail.health.documents.download")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
