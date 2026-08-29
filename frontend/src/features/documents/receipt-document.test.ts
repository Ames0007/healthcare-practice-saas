import { describe, expect, it } from "vitest";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import { getDocumentSettingsMockData } from "@/features/parametres/mock-document-settings-data";
import { buildReceiptDocument } from "./receipt-document";

const payment = getPaymentsMockData().find((candidate) => candidate.id === "pay-1")!;
const invoice = getInvoicesMockData().find((candidate) => candidate.id === "inv-2")!;
const cabinet = getCabinetProfileMockData();
const documentSettings = getDocumentSettingsMockData();

describe("buildReceiptDocument (UI-DOCS-X §18)", () => {
  it("reuses the payment's own receipt number, never a new numbering sequence (§15)", () => {
    const model = buildReceiptDocument(payment, "Youssef Amrani", "PAT-00284", cabinet, documentSettings, "Espèces");
    expect(model.reference).toBe(payment.receipt!.receiptNumber);
    expect(model.filename).toBe(`Recu-${payment.receipt!.receiptNumber}.pdf`);
  });

  it("reconciles amount 1:1 against the source Payment (§17)", () => {
    const model = buildReceiptDocument(payment, "Youssef Amrani", "PAT-00284", cabinet, documentSettings, "Espèces");
    expect(model.amount).toBe(payment.amount);
    expect(model.amountValueLabel).toContain("800");
  });

  it("carries the caller-resolved payment method label verbatim", () => {
    const model = buildReceiptDocument(payment, "Youssef Amrani", "PAT-00284", cabinet, documentSettings, "Espèces");
    expect(model.methodValueLabel).toBe("Espèces");
  });

  it("includes the related invoice reference when one is passed, and omits it when absent", () => {
    const withInvoice = buildReceiptDocument(payment, "Youssef Amrani", "PAT-00284", cabinet, documentSettings, "Espèces", invoice);
    expect(withInvoice.invoiceValueLabel).toBe(invoice.invoiceNumber);

    const withoutInvoice = buildReceiptDocument(payment, "Youssef Amrani", "PAT-00284", cabinet, documentSettings, "Espèces");
    expect(withoutInvoice.invoiceLabel).toBeUndefined();
    expect(withoutInvoice.invoiceValueLabel).toBeUndefined();
  });

  it("never invents a source of truth beyond the passed-in Payment", () => {
    const model = buildReceiptDocument(payment, "Youssef Amrani", "PAT-00284", cabinet, documentSettings, "Espèces");
    expect(model.sourceRecordId).toBe(payment.id);
  });
});
