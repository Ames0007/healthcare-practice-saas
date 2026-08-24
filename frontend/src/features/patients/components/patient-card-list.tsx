"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Avatar } from "@/components/ui/avatar";
import {
  formatMad,
  formatNextAppointment,
  getPatientFullName,
  getPatientInitials,
} from "@/features/patients/format";
import type { Patient } from "@/features/patients/types";

/** Mobile compact cards (UI-003A §22) — the full row becomes one tap target, not a table. */
export function PatientCardList({ patients }: { patients: Patient[] }) {
  const { t, locale } = useLocale();

  return (
    <div className="flex flex-col divide-y divide-border md:hidden">
      {patients.map((patient) => (
        <Link
          key={patient.id}
          href={`/app/patients/${patient.id}`}
          className="flex flex-col gap-2 py-4 transition-colors hover:bg-surface-subtle"
        >
          <div className="flex items-center gap-3">
            <Avatar initials={getPatientInitials(patient)} />
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{getPatientFullName(patient)}</p>
              <p className="text-xs text-text-muted" dir="ltr">
                {patient.patientNumber}
              </p>
            </div>
          </div>

          <p className="text-sm text-text-secondary" dir="ltr">
            {patient.phone}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <div>
              <p className="text-xs text-text-muted">{t("patients.table.nextAppointment")}</p>
              <p className="tabular-nums text-text-secondary">
                {patient.nextAppointment
                  ? formatNextAppointment(patient.nextAppointment, locale)
                  : t("patients.noNextAppointment")}
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs text-text-muted">{t("patients.table.balance")}</p>
              <p className="tabular-nums text-text-secondary">
                {patient.outstandingBalance > 0 ? formatMad(patient.outstandingBalance, locale) : t("patients.balance.none")}
              </p>
            </div>
          </div>

          <p className="text-xs text-text-muted">{patient.responsiblePractitionerName}</p>
        </Link>
      ))}
    </div>
  );
}
