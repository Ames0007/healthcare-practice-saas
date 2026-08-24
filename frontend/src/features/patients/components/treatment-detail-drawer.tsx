"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button, buttonClassNames } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SessionProgress } from "@/components/domain/treatments/session-progress";
import { SessionTracker } from "@/components/domain/treatments/session-tracker";
import { TREATMENT_STATUS_MAP } from "@/components/domain/treatments/treatment-status";
import { SESSION_STATUS_MAP } from "@/components/domain/treatments/session-status";
import type { TreatmentPlan, TreatmentSession } from "@/components/domain/treatments/types";
import { formatDayMonth } from "@/features/patients/format";
import { countSessionsByStatus, findNextSession } from "@/features/patients/treatments";

const AGENDA_HREF = "/app/agenda";

export interface TreatmentDetailDrawerProps {
  plan: TreatmentPlan | null;
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Treatment/session detail (Spec #9 Screens 22-23, UI-004C §17-24). One
 * Dialog instance with two internal views (treatment / a selected
 * session) rather than a second nested drawer — reuses the shared Dialog
 * drawer architecture unmodified, matching UI-004B's precedent of never
 * forking a second detail surface. The caller remounts this component via
 * a changing `key` on every open (mirroring UI-002's `formDialogKey`), so
 * a fresh open always starts on the treatment view without a reset effect.
 */
export function TreatmentDetailDrawer({ plan, patientId, patientName, open, onClose }: TreatmentDetailDrawerProps) {
  const { t, locale } = useLocale();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (!plan) {
    return null;
  }

  const selectedSession = plan.sessions.find((session) => session.id === selectedSessionId) ?? null;
  const { completed, scheduled } = countSessionsByStatus(plan.sessions);
  const next = findNextSession(plan.sessions);
  const statusMeta = TREATMENT_STATUS_MAP[plan.status];

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={plan.title} closeLabel={t("agenda.drawer.close")}>
      {selectedSession ? (
        <SessionDetailView
          session={selectedSession}
          totalSessions={plan.sessions.length}
          locale={locale}
          onBack={() => setSelectedSessionId(null)}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-text">{plan.title}</h2>
              <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
            </div>
            <p className="mt-1 text-sm text-text-muted">{patientName}</p>
            <p className="text-sm text-text-muted">{plan.practitionerName}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("patientDetail.treatments.startDateLabel")}
            </p>
            <p className="text-sm text-text" dir="ltr">
              {formatDayMonth(plan.startDate, locale)}
            </p>
          </div>

          <SessionProgress completed={completed} scheduled={scheduled} total={plan.sessions.length} />

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t("patientDetail.treatments.sessionsTitle")}
            </h3>
            <div className="mt-3">
              <SessionTracker sessions={plan.sessions} onSelect={setSelectedSessionId} />
            </div>
          </div>

          {next && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("patientDetail.treatments.nextSessionLabel")}
              </p>
              <p className="text-sm text-text" dir="ltr">
                {formatDayMonth(next.scheduledDate!, locale)} · {next.scheduledTime}
              </p>
            </div>
          )}

          {plan.status === "active" && (
            <Link href={AGENDA_HREF} className={buttonClassNames("primary", "sm")}>
              {t("patientDetail.treatments.planNextSession")}
            </Link>
          )}

          <Link
            href={`/app/patients/${patientId}/invoices`}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {t("patientDetail.treatments.viewBilling")}
          </Link>
        </div>
      )}
    </Dialog>
  );
}

interface SessionDetailViewProps {
  session: TreatmentSession;
  totalSessions: number;
  locale: Parameters<typeof formatDayMonth>[1];
  onBack: () => void;
}

/** Session sub-view (Spec #9 Screen 23, UI-004C §22-24) — never shows clinical notes; a future "Voir la consultation" link stays disabled. */
function SessionDetailView({ session, totalSessions, locale, onBack }: SessionDetailViewProps) {
  const { t } = useLocale();
  const statusMeta = SESSION_STATUS_MAP[session.status];

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="w-fit ps-0">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {t("patientDetail.treatments.backToTreatment")}
      </Button>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-text">
            {t("patientDetail.treatments.sessionHeading", { n: session.sequenceNumber, total: totalSessions })}
          </h2>
          <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
        </div>
      </div>

      {session.scheduledDate && (
        <div className="flex flex-col gap-1 text-sm text-text">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.treatments.dateLabel")}
          </p>
          <p dir="ltr">
            {formatDayMonth(session.scheduledDate, locale)}
            {session.scheduledTime && ` · ${session.scheduledTime}`}
          </p>
        </div>
      )}

      {session.practitionerName && (
        <div className="flex flex-col gap-1 text-sm text-text">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.treatments.practitionerLabel")}
          </p>
          <p>{session.practitionerName}</p>
        </div>
      )}

      {session.status === "completed" && (
        <>
          {session.appointmentId && (
            <div className="flex flex-col gap-1 text-sm text-text">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("patientDetail.treatments.appointmentRefLabel")}
              </p>
              <p dir="ltr">{session.appointmentId}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled
            title={t("agenda.drawer.futureFeature")}
            className="w-fit"
          >
            {t("patientDetail.treatments.futureConsultationLink")}
          </Button>
        </>
      )}

      {session.status === "scheduled" && (
        <Link href={AGENDA_HREF} className={buttonClassNames("primary", "sm", "w-fit")}>
          {t("patientDetail.appointments.openInAgenda")}
        </Link>
      )}

      {session.status === "unscheduled" && (
        <Link href={AGENDA_HREF} className={buttonClassNames("primary", "sm", "w-fit")}>
          {t("patientDetail.treatments.planSession")}
        </Link>
      )}
    </div>
  );
}
