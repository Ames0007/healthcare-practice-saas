import { describe, expect, it } from "vitest";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import { getDocumentSettingsMockData } from "@/features/parametres/mock-document-settings-data";
import { buildInvoiceDocument } from "./invoice-document";

const invoice = getInvoicesMockData().find((candidate) => candidate.id === "inv-1")!;
const cabinet = getCabinetProfileMockData();

describe("buildInvoiceDocument (UI-DOCS-X §16/§17)", () => {
  it("reuses the invoice's own human-facing reference, never a new numbering sequence (§15)", () => {
    const model = buildInvoiceDocument(invoice, "Ahmed Alaoui", "PAT-00281", cabinet, getDocumentSettingsMockData());
    expect(model.reference).toBe(invoice.invoiceNumber);
    expect(model.filename).toBe(`Facture-${invoice.invoiceNumber}.pdf`);
  });

  it("reconciles totalAmount/paidAmount/remainingAmount 1:1 against the source Invoice (§17)", () => {
    const model = buildInvoiceDocument(invoice, "Ahmed Alaoui", "PAT-00281", cabinet, getDocumentSettingsMockData());
    expect(model.totalAmount).toBe(invoice.totalAmount);
    expect(model.paidAmount).toBe(invoice.paidAmount);
    expect(model.remainingAmount).toBe(invoice.remainingAmount);
  });

  it("never independently recalculates the total from lines with a different formula", () => {
    const model = buildInvoiceDocument(invoice, "Ahmed Alaoui", "PAT-00281", cabinet, getDocumentSettingsMockData());
    const linesSum = invoice.lines.reduce((sum, line) => sum + line.totalAmount, 0);
    // The model's totalAmount is the invoice's own field, which happens to equal the lines sum in this
    // fixture — asserted against the source field directly, not re-derived here.
    expect(model.totalAmount).toBe(linesSum);
    expect(model.totalAmount).toBe(invoice.totalAmount);
  });

  it("carries the exact patient identity passed in, never re-resolving it internally", () => {
    const model = buildInvoiceDocument(invoice, "Ahmed Alaoui", "PAT-00281", cabinet, getDocumentSettingsMockData());
    expect(model.patientName).toBe("Ahmed Alaoui");
    expect(model.patientNumber).toBe("PAT-00281");
  });

  it("never invents VAT/tax-id/insurance fields absent from the domain model", () => {
    const model = buildInvoiceDocument(invoice, "Ahmed Alaoui", "PAT-00281", cabinet, getDocumentSettingsMockData());
    expect(model).not.toHaveProperty("vat");
    expect(model).not.toHaveProperty("taxId");
    expect(model).not.toHaveProperty("insuranceReimbursement");
  });

  it("renders in French when documentLanguage is fr, and Arabic when ar — independent of the invoice content itself", () => {
    const frModel = buildInvoiceDocument(invoice, "Ahmed Alaoui", "PAT-00281", cabinet, { footerText: "x", documentLanguage: "fr" });
    const arModel = buildInvoiceDocument(invoice, "أحمد العلوي", "PAT-00281", cabinet, { footerText: "x", documentLanguage: "ar" });
    expect(frModel.title).toBe("FACTURE");
    expect(arModel.title).toBe("فاتورة");
    expect(arModel.locale).toBe("ar");
  });

  it("reuses the existing cabinet identity fixture, never a second cabinet fixture universe", () => {
    const model = buildInvoiceDocument(invoice, "Ahmed Alaoui", "PAT-00281", cabinet, getDocumentSettingsMockData());
    expect(model.cabinet.name).toBe(cabinet.name);
    expect(model.cabinet.phone).toBe(cabinet.phone);
  });
});
