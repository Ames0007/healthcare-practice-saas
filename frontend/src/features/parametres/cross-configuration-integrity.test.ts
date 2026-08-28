import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { SERVICES } from "@/features/agenda/mock-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { generatePatientNumber } from "@/features/patients/patient-number";
import { generateEmployeeNumber } from "@/features/team/employee-number";
import { WEEKDAY_ORDER } from "@/features/team/schedule";
import { getCabinetProfileMockData } from "./mock-cabinet-profile-data";
import { getCabinetServicesMockData } from "./mock-cabinet-services-data";
import { getCabinetWorkingHoursMockData } from "./mock-cabinet-working-hours-data";
import { buildInitialWorkingHoursFormValues, buildWorkingHoursFromFormValues } from "./working-hours";
import { computeNumberingSummary } from "./numbering";
import { getAppointmentSettingsMockData } from "./mock-appointment-settings-data";
import { getPaymentMethodRows } from "./mock-payment-methods-data";
import { buildDefaultDocumentFooter } from "./document-settings";
import { getDocumentSettingsMockData } from "./mock-document-settings-data";

/**
 * Proves every Paramètres figure traces back to its own source, and that
 * the settings this task introduces stay consistent with what previously-
 * shipped modules already assume — mirrors `cross-reporting-integrity.test.ts`'s
 * own discipline (task's repository-inspection guidance §5: "We have
 * accumulated prototype constants across previous UI tasks. UI-010 should
 * provide them a coherent configuration home").
 */
describe("Cross-configuration integrity", () => {
  it("Services: every configured service name traces back to Agenda's own SERVICES catalog exactly (no disconnected new list)", () => {
    const services = getCabinetServicesMockData();
    expect(services.every((service) => SERVICES.includes(service.name))).toBe(true);
    expect(services).toHaveLength(SERVICES.length);
  });

  it("Cabinet profile: currency is fixed to MAD, matching every financial fixture's own hardcoded currency literal", () => {
    const profile = getCabinetProfileMockData();
    const invoices = getInvoicesMockData();
    expect(profile.currencyCode).toBe("MAD");
    expect(invoices.every((invoice) => invoice.currency === "MAD")).toBe(true);
  });

  it("Working hours: round-trips through the exact same Weekday order Équipe's own schedule module uses (WEEKDAY_ORDER), never a second weekday sequence", () => {
    const days = getCabinetWorkingHoursMockData();
    expect(days.map((day) => day.weekday)).toEqual(WEEKDAY_ORDER);

    const rebuilt = buildWorkingHoursFromFormValues(buildInitialWorkingHoursFormValues(days));
    expect(rebuilt).toEqual(days);
  });

  it("Numbering: PAT/EMP rows reconcile exactly with the real generators Patients/Équipe already use in production flows (create-patient, create-employee)", () => {
    const patients = getPatientsMockData();
    const members = getTeamMembersMockData();
    const rows = computeNumberingSummary(patients, members, getInvoicesMockData(), getPaymentsMockData(), MOCK_BUSINESS_DATE);

    expect(rows.find((row) => row.sequenceType === "PAT")?.nextNumber).toBe(generatePatientNumber(patients));
    expect(rows.find((row) => row.sequenceType === "EMP")?.nextNumber).toBe(generateEmployeeNumber(members));
  });

  it("Numbering: FAC/REC next numbers are always strictly greater than every existing issued number for the current year (never a collision)", () => {
    const invoices = getInvoicesMockData();
    const payments = getPaymentsMockData();
    const rows = computeNumberingSummary(getPatientsMockData(), getTeamMembersMockData(), invoices, payments, MOCK_BUSINESS_DATE);

    const facNext = Number(rows.find((row) => row.sequenceType === "FAC")!.nextNumber.split("-")[2]);
    const existingFacNumbers = invoices
      .filter((invoice) => invoice.invoiceNumber.startsWith("FAC-2026-"))
      .map((invoice) => Number(invoice.invoiceNumber.split("-")[2]));
    expect(facNext).toBeGreaterThan(Math.max(...existingFacNumbers));

    const recNext = Number(rows.find((row) => row.sequenceType === "REC")!.nextNumber.split("-")[2]);
    const existingRecNumbers = payments
      .map((payment) => payment.receipt?.receiptNumber)
      .filter((value): value is string => value != null && value.startsWith("REC-2026-"))
      .map((value) => Number(value.split("-")[2]));
    expect(recNext).toBeGreaterThan(Math.max(...existingRecNumbers));
  });

  it("Rendez-vous: the default scheduling mode matches the majority mode actually configured across Services (never an arbitrary invented default)", () => {
    const services = getCabinetServicesMockData();
    const appointmentSettings = getAppointmentSettingsMockData();
    const exactCount = services.filter((service) => service.schedulingMode === "exact").length;
    const windowCount = services.filter((service) => service.schedulingMode === "window").length;
    const majorityMode = exactCount >= windowCount ? "exact" : "window";

    expect(appointmentSettings.defaultSchedulingMode).toBe(majorityMode);
  });

  it("Paiements: the configured payment method is the exact literal Finance's own Payment.method fixtures use (no disconnected method list)", () => {
    const rows = getPaymentMethodRows();
    const payments = getPaymentsMockData();

    expect(rows).toHaveLength(1);
    expect(payments.every((payment) => payment.method === rows[0].method)).toBe(true);
  });

  it("Documents: the footer default is derived live from the Cabinet profile fixture, not an independently hardcoded string", () => {
    const profile = getCabinetProfileMockData();
    const documentSettings = getDocumentSettingsMockData();

    expect(documentSettings.footerText).toBe(buildDefaultDocumentFooter(profile));
    expect(documentSettings.footerText).toContain(profile.name);
    expect(documentSettings.documentLanguage).toBe(profile.preferredLanguage);
  });
});
