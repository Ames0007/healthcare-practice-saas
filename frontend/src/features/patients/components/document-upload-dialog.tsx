"use client";

import { useId, useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_CATEGORY_MAP } from "@/components/domain/clinical/document-category";
import type { ClinicalDocument, ClinicalDocumentCategory } from "@/components/domain/clinical/types";
import { PATIENTS_TODAY_DATE } from "@/features/patients/mock-data";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const CATEGORY_ORDER: ClinicalDocumentCategory[] = ["analysis", "imaging", "report", "prescription", "other"];

interface SelectedFileMeta {
  name: string;
  type: string;
  size: number;
}

export interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  practitionerName: string;
  existingCount: number;
  onSuccess: (document: ClinicalDocument) => void;
}

/**
 * Prototype "Ajouter un document" form (Spec #8 native-input guidance,
 * UI-005D §16-23). Only file metadata (`name`/`type`/`size`) is ever read
 * from the native `<input type="file">` — the file's contents are never
 * accessed, no `FileReader`, no Base64, no `ObjectURL` (§19). Nothing is
 * uploaded anywhere; a valid submit only appends synthetic metadata to
 * `DocumentsSection`'s own local state.
 */
export function DocumentUploadDialog({ open, onClose, patientId, practitionerName, existingCount, onSuccess }: DocumentUploadDialogProps) {
  const { t } = useLocale();
  const fileInputId = useId();
  const [fileMeta, setFileMeta] = useState<SelectedFileMeta | null>(null);
  const [category, setCategory] = useState<ClinicalDocumentCategory | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileMeta(file ? { name: file.name, type: file.type, size: file.size } : null);
  }

  function validate(): Record<string, string> {
    const nextErrors: Record<string, string> = {};
    if (!fileMeta) {
      nextErrors.file = t("patientDetail.health.documents.form.fileRequiredError");
    } else if (!ALLOWED_MIME_TYPES.includes(fileMeta.type)) {
      nextErrors.file = t("patientDetail.health.documents.form.fileTypeError");
    }
    if (!category) {
      nextErrors.category = t("patientDetail.health.documents.form.categoryRequiredError");
    }
    if (!title.trim()) {
      nextErrors.title = t("patientDetail.health.documents.form.titleRequiredError");
    }
    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !fileMeta || !category) {
      return;
    }

    const newDocument: ClinicalDocument = {
      id: `doc-new-${existingCount + 1}`,
      patientId,
      category,
      title: title.trim(),
      fileName: fileMeta.name,
      mimeType: fileMeta.type,
      sizeBytes: fileMeta.size,
      uploadedAt: PATIENTS_TODAY_DATE,
      uploadedBy: practitionerName,
      description: description.trim() || undefined,
    };

    onSuccess(newDocument);
  }

  const title_ = t("patientDetail.health.documents.uploadTitle");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title_} closeLabel={t("agenda.drawer.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{title_}</h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={fileInputId} className="text-sm font-medium text-text-secondary">
            {t("patientDetail.health.documents.fileLabel")}
            <span className="text-danger" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id={fileInputId}
            type="file"
            accept={ALLOWED_MIME_TYPES.join(",")}
            onChange={handleFileChange}
            aria-invalid={!!errors.file || undefined}
            className="text-sm text-text file:me-3 file:rounded-md file:border file:border-border-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text hover:file:bg-surface-subtle"
          />
          {errors.file && <p className="text-sm text-danger">{errors.file}</p>}
        </div>

        <Select
          label={t("patientDetail.health.documents.categoryLabel")}
          required
          value={category}
          onChange={(event) => setCategory(event.target.value as ClinicalDocumentCategory)}
          options={CATEGORY_ORDER.map((value) => ({ value, label: t(DOCUMENT_CATEGORY_MAP[value].translationKey) }))}
          placeholder={t("patientDetail.health.documents.form.categoryPlaceholder")}
          error={errors.category}
        />

        <Input
          label={t("patientDetail.health.documents.form.titleLabel")}
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
        />

        <Textarea
          label={t("patientDetail.health.documents.descriptionLabel")}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t("patientDetail.health.documents.form.cancel")}
          </Button>
          <Button type="submit" size="sm">
            {t("patientDetail.health.documents.form.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
