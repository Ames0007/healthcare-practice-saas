"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Avatar } from "@/components/ui/avatar";
import {
  formatMad,
  formatNextAppointment,
  formatShortDate,
  getPatientFullName,
  getPatientInitials,
} from "@/features/patients/format";
import type { Patient } from "@/features/patients/types";

/** Desktop table (UI-003A §11-13, §23): all six columns + a compact "Ouvrir" action. */
export function PatientTable({ patients }: { patients: Patient[] }) {
  const { t, locale } = useLocale();

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
            <th className="px-4 py-3 text-start">{t("patients.table.patient")}</th>
            <th className="px-4 py-3 text-start">{t("patients.table.phone")}</th>
            <th className="px-4 py-3 text-start">{t("patients.table.practitioner")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("patients.table.lastVisit")}</th>
            <th className="px-4 py-3 text-start">{t("patients.table.nextAppointment")}</th>
            <th className="px-4 py-3 text-start">{t("patients.table.balance")}</th>
            <th className="px-4 py-3 text-start">
              <span className="sr-only">{t("patients.table.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar initials={getPatientInitials(patient)} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{getPatientFullName(patient)}</p>
                    <p className="text-xs text-text-muted" dir="ltr">
                      {patient.patientNumber}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums text-text-secondary" dir="ltr">
                {patient.phone}
              </td>
              <td className="px-4 py-3 text-text-secondary">{patient.responsiblePractitionerName}</td>
              <td className="hidden px-4 py-3 tabular-nums text-text-secondary lg:table-cell">
                {patient.lastVisit ? formatShortDate(patient.lastVisit, locale) : t("patients.noLastVisit")}
              </td>
              <td className="px-4 py-3 tabular-nums text-text-secondary">
                {patient.nextAppointment
                  ? formatNextAppointment(patient.nextAppointment, locale)
                  : t("patients.noNextAppointment")}
              </td>
              <td className="px-4 py-3 tabular-nums text-text-secondary">
                {patient.outstandingBalance > 0 ? formatMad(patient.outstandingBalance, locale) : t("patients.balance.none")}
              </td>
              <td className="px-4 py-3 text-end">
                <Link
                  href={`/app/patients/${patient.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {t("patients.open")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
