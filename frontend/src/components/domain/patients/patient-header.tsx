"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClassNames } from "@/components/ui/button";
import { useLocale } from "@/i18n/locale-provider";

export interface PatientHeaderNextAppointment {
  label: string;
  service: string | null;
}

export interface PatientHeaderBalance {
  label: string;
}

export interface PatientHeaderData {
  fullName: string;
  initials: string;
  patientNumber: string;
  phone: string;
  /** `null` when date of birth is unknown — never invent an age (UI-004A §12). */
  age: number | null;
  practitionerName: string;
  /** `null` when the patient has no next appointment — the header renders the "no appointment" fallback text itself. */
  nextAppointment: PatientHeaderNextAppointment | null;
  /** `null` when there is no outstanding balance — never a red/danger amount (UI-004A §15). */
  balance: PatientHeaderBalance | null;
}

export interface PatientHeaderProps {
  patient: PatientHeaderData;
  onFacturer: () => void;
  onEncaisser: () => void;
  onPlus: () => void;
}

/**
 * Persistent Patient 360° identity/context header (Spec #7 §10, Spec #9
 * Screen 17). Pure presentation — every value arrives pre-resolved from
 * the caller (UI-004A §11); this component has no mock-data coupling and
 * no business/authorization logic of its own, only layout and its own
 * static chrome text.
 */
export function PatientHeader({ patient, onFacturer, onEncaisser, onPlus }: PatientHeaderProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <Avatar initials={patient.initials} className="h-12 w-12 text-base" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-xl font-semibold text-text">{patient.fullName}</h1>
            <span className="text-sm text-text-muted" dir="ltr">
              {patient.patientNumber}
            </span>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-text-secondary">
            <span dir="ltr">{patient.phone}</span>
            {patient.age !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span>{t("patientDetail.ageYears", { age: patient.age })}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{patient.practitionerName}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("patientDetail.overview.nextAppointmentLabel")}
              </p>
              <p className="text-sm text-text-secondary">
                {patient.nextAppointment ? (
                  <span dir="ltr">
                    {patient.nextAppointment.label}
                    {patient.nextAppointment.service && <span> · {patient.nextAppointment.service}</span>}
                  </span>
                ) : (
                  t("patientDetail.noNextAppointment")
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("patientDetail.overview.balanceLabel")}
              </p>
              <p className="text-sm text-text-secondary">
                {patient.balance ? <span dir="ltr">{patient.balance.label}</span> : t("patientDetail.overview.noBalance")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/app/agenda" className={buttonClassNames("primary", "sm")}>
          {t("patientDetail.header.newAppointment")}
        </Link>
        <Button type="button" variant="outline" size="sm" onClick={onFacturer}>
          {t("patientDetail.header.invoice")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onEncaisser}>
          {t("patientDetail.header.collectPayment")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onPlus}>
          {t("patientDetail.header.more")}
        </Button>
      </div>
    </div>
  );
}
