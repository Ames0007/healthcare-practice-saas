"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type ConsultationFormField = "reason" | "observations" | "assessment" | "plan";

export interface ConsultationFormProps {
  reason: string;
  observations: string;
  assessment: string;
  plan: string;
  reasonError?: string | null;
  isDirty: boolean;
  onChange: (field: ConsultationFormField, value: string) => void;
  onSaveDraft: () => void;
  onRequestComplete: () => void;
}

/**
 * Editable Motif/Observations/Évaluation/Plan fields (Spec #9 Screen 20,
 * UI-005C §11/§15). Plain structured text only — no rich-text editor, no
 * specialty-driven dynamic form (§17-19, out of this bounded prototype's
 * scope), no AI assistance of any kind (§20). Draft saving requires
 * nothing (§21 — only completion enforces the required reason, via
 * `reasonError` passed down from the workspace page).
 */
export function ConsultationForm({
  reason,
  observations,
  assessment,
  plan,
  reasonError,
  isDirty,
  onChange,
  onSaveDraft,
  onRequestComplete,
}: ConsultationFormProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t("patientDetail.consultation.form.reasonLabel")}
        placeholder={t("patientDetail.consultation.form.reasonPlaceholder")}
        value={reason}
        onChange={(event) => onChange("reason", event.target.value)}
        required
        error={reasonError ?? undefined}
      />
      <Textarea
        label={t("patientDetail.health.history.observationsLabel")}
        value={observations}
        onChange={(event) => onChange("observations", event.target.value)}
      />
      <Textarea
        label={t("patientDetail.health.history.assessmentLabel")}
        value={assessment}
        onChange={(event) => onChange("assessment", event.target.value)}
      />
      <Textarea
        label={t("patientDetail.health.history.planLabel")}
        value={plan}
        onChange={(event) => onChange("plan", event.target.value)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {isDirty ? (
          <p className="text-sm text-warning">{t("patientDetail.consultation.form.unsavedChanges")}</p>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onSaveDraft}>
            {t("patientDetail.consultation.form.saveDraft")}
          </Button>
          <Button type="button" size="sm" onClick={onRequestComplete}>
            {t("patientDetail.consultation.form.complete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
