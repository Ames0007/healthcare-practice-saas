"use client";

import { useLocale } from "@/i18n/locale-provider";

export interface ConsultationStructuredDetailProps {
  reason?: string;
  observations?: string;
  assessment?: string;
  plan?: string;
}

/**
 * Read-only Motif/Observations/Évaluation/Plan sections (Spec #9 Screen
 * 18/20). Extracted out of UI-005B's `ConsultationDetailDrawer` so
 * UI-005C's completed-consultation view can reuse the exact same
 * structured presentation instead of duplicating the four near-identical
 * labeled blocks (UI-005C §30 — "reuse where clean, don't duplicate the
 * whole read-only component").
 */
export function ConsultationStructuredDetail({ reason, observations, assessment, plan }: ConsultationStructuredDetailProps) {
  const { t } = useLocale();

  return (
    <>
      {reason && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.history.reasonLabel")}
          </p>
          <p className="text-sm text-text">{reason}</p>
        </div>
      )}

      {observations && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.history.observationsLabel")}
          </p>
          <p className="text-sm text-text">{observations}</p>
        </div>
      )}

      {assessment && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.history.assessmentLabel")}
          </p>
          <p className="text-sm text-text">{assessment}</p>
        </div>
      )}

      {plan && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.history.planLabel")}
          </p>
          <p className="text-sm text-text">{plan}</p>
        </div>
      )}
    </>
  );
}
