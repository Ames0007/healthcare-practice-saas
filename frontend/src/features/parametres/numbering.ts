import type { Invoice, Payment } from "@/components/domain/finance/types";
import type { NumberingSequenceRow } from "@/components/domain/settings/types";
import type { TeamMember } from "@/components/domain/team/types";
import type { Patient } from "@/features/patients/types";
import { generatePatientNumber } from "@/features/patients/patient-number";
import { generateEmployeeNumber } from "@/features/team/employee-number";

const INVOICE_NUMBER_PATTERN = /^FAC-(\d{4})-(\d+)$/;
const RECEIPT_NUMBER_PATTERN = /^REC-(\d{4})-(\d+)$/;

/** Same regex-extract-max+1 pattern as `generatePatientNumber`/`generateEmployeeNumber` — applied locally since no FAC/REC generator exists yet to reuse (see `NumberingSequenceRow`'s own doc comment). */
function computeNextYearlyNumber(existingNumbers: string[], pattern: RegExp, prefix: string, year: string, digits: number): string {
  const highest = existingNumbers.reduce((max, value) => {
    const match = pattern.exec(value);
    if (!match || match[1] !== year) return max;
    return Math.max(max, Number(match[2]));
  }, 0);

  return `${prefix}-${year}-${String(highest + 1).padStart(digits, "0")}`;
}

/**
 * Read-only numbering configuration summary (UI-010ABC §18) — every
 * "next number" is computed live from the same fixtures each sequence
 * already draws from, never hardcoded. `businessDate` supplies the current
 * year for the two year-reset sequences (FAC/REC).
 */
export function computeNumberingSummary(
  patients: Patient[],
  members: TeamMember[],
  invoices: Invoice[],
  payments: Payment[],
  businessDate: string,
): NumberingSequenceRow[] {
  const year = businessDate.slice(0, 4);

  return [
    {
      sequenceType: "PAT",
      labelKey: "parametres.numbering.sequence.patient",
      prefix: "PAT",
      yearReset: false,
      nextNumber: generatePatientNumber(patients),
    },
    {
      sequenceType: "EMP",
      labelKey: "parametres.numbering.sequence.employee",
      prefix: "EMP",
      yearReset: false,
      nextNumber: generateEmployeeNumber(members),
    },
    {
      sequenceType: "FAC",
      labelKey: "parametres.numbering.sequence.invoice",
      prefix: "FAC",
      yearReset: true,
      nextNumber: computeNextYearlyNumber(invoices.map((invoice) => invoice.invoiceNumber), INVOICE_NUMBER_PATTERN, "FAC", year, 5),
    },
    {
      sequenceType: "REC",
      labelKey: "parametres.numbering.sequence.receipt",
      prefix: "REC",
      yearReset: true,
      nextNumber: computeNextYearlyNumber(
        payments.map((payment) => payment.receipt?.receiptNumber).filter((value): value is string => Boolean(value)),
        RECEIPT_NUMBER_PATTERN,
        "REC",
        year,
        5,
      ),
    },
  ];
}
