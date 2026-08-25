"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";

export interface RelatedAppointmentNoteProps {
  appointmentId: string;
  /** Safe navigation to the Rendez-vous tab — never a specific deep-linked record (§27/§32). */
  href: string;
  className?: string;
}

/**
 * "Rendez-vous associé" note (UI-005B §27, reused by UI-005C §32) —
 * extracted so both the historical `ConsultationDetailDrawer` and the
 * active `ConsultationWorkspacePage` show the exact same block instead of
 * two near-identical copies.
 */
export function RelatedAppointmentNote({ appointmentId, href, className }: RelatedAppointmentNoteProps) {
  const { t } = useLocale();

  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {t("patientDetail.health.history.relatedAppointmentLabel")}
      </p>
      <p className="text-sm text-text" dir="ltr">
        {appointmentId}
      </p>
      <Link href={href} className="mt-1 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline">
        {t("patientDetail.health.history.viewAppointment")}
      </Link>
    </div>
  );
}
