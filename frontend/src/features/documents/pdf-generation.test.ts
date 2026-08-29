import { describe, expect, it, beforeAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Font, renderToBuffer } from "@react-pdf/renderer";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getPrescriptionsMockData } from "@/features/patients/mock-prescriptions-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getPatientFullName } from "@/features/patients/format";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getPayrollEntriesMockData, getPayrollPeriodsMockData } from "@/features/team/mock-payroll-data";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import type { DocumentSettings } from "@/components/domain/settings/types";
import { buildInvoiceDocument } from "./invoice-document";
import { InvoiceDocumentPdf } from "./invoice-document-pdf";
import { buildReceiptDocument } from "./receipt-document";
import { ReceiptDocumentPdf } from "./receipt-document-pdf";
import { buildPrescriptionDocument } from "./prescription-document";
import { PrescriptionDocumentPdf } from "./prescription-document-pdf";
import { buildPayslipDocument } from "./payslip-document";
import { PayslipDocumentPdf } from "./payslip-document-pdf";
import { ARABIC_FONT_FAMILY } from "./fonts";

/**
 * Real end-to-end PDF generation (task §38 item 3, §39 "Actual File
 * Verification" — unit tests on the data model alone are not sufficient).
 * Registers the Arabic font from an on-disk path (Node-appropriate) rather
 * than `ensureDocumentFontsRegistered()`'s `/fonts/...` browser-fetch path
 * — both register the exact same `ARABIC_FONT_FAMILY`, so production
 * styling code is exercised unmodified. Files are written under the OS
 * temp dir (never into the repo) purely so a human/visual QA pass can open
 * them; the test itself only asserts structural validity — it deliberately
 * does NOT assert glyph-level visual correctness (impossible from a byte
 * buffer alone). Visual QA of these exact files found real Arabic glyph-
 * shaping corruption in `@react-pdf/renderer`, which is why Arabic
 * generation is gated off in the UI layer via `isDocumentLanguageSupported`
 * (`capabilities.ts`, ADR-016) — the builder/PDF-component code underneath
 * is still exercised and kept working for when the upstream bug is fixed.
 */
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-docs-x-qa-"));

beforeAll(() => {
  Font.register({
    family: ARABIC_FONT_FAMILY,
    fonts: [
      { src: path.join(process.cwd(), "public/fonts/NotoNaskhArabic-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(process.cwd(), "public/fonts/NotoNaskhArabic-Bold.ttf"), fontWeight: "bold" },
    ],
  });
});

function assertValidPdf(buffer: Buffer) {
  expect(buffer.length).toBeGreaterThan(0);
  expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
}

function writeQaFile(name: string, buffer: Buffer) {
  fs.writeFileSync(path.join(outDir, name), buffer);
}

const cabinet = getCabinetProfileMockData();
const frSettings: DocumentSettings = { footerText: "Cabinet (exemple) — 05 22 34 56 78 — 12 Rue des Orangers", documentLanguage: "fr" };
const arSettings: DocumentSettings = { footerText: "العيادة (مثال) — 05 22 34 56 78", documentLanguage: "ar" };

describe("real PDF generation (UI-DOCS-X §38-40)", () => {
  it("generates a valid, non-empty French invoice PDF", async () => {
    const invoice = getInvoicesMockData().find((candidate) => candidate.id === "inv-1")!;
    const patient = getPatientsMockData().find((candidate) => candidate.id === "pat-1")!;
    const model = buildInvoiceDocument(invoice, getPatientFullName(patient), patient.patientNumber, cabinet, frSettings);
    const buffer = await renderToBuffer(InvoiceDocumentPdf({ model }));
    assertValidPdf(buffer);
    writeQaFile("invoice-fr.pdf", buffer);
  });

  it("generates a valid, non-empty Arabic invoice PDF with the embedded RTL font — never throws (§31)", async () => {
    const invoice = getInvoicesMockData().find((candidate) => candidate.id === "inv-1")!;
    const patient = getPatientsMockData().find((candidate) => candidate.id === "pat-1")!;
    const model = buildInvoiceDocument(invoice, "أحمد العلوي", patient.patientNumber, cabinet, arSettings);
    const buffer = await renderToBuffer(InvoiceDocumentPdf({ model }));
    assertValidPdf(buffer);
    writeQaFile("invoice-ar.pdf", buffer);
  });

  it("generates a valid, non-empty receipt PDF", async () => {
    const payment = getPaymentsMockData().find((candidate) => candidate.id === "pay-1")!;
    const invoice = getInvoicesMockData().find((candidate) => candidate.id === "inv-2");
    const patient = getPatientsMockData().find((candidate) => candidate.id === "pat-4")!;
    const model = buildReceiptDocument(payment, getPatientFullName(patient), patient.patientNumber, cabinet, frSettings, "Espèces", invoice);
    const buffer = await renderToBuffer(ReceiptDocumentPdf({ model }));
    assertValidPdf(buffer);
    writeQaFile("receipt-fr.pdf", buffer);
  });

  it("generates a valid, non-empty Arabic prescription PDF", async () => {
    const prescription = getPrescriptionsMockData().find((candidate) => candidate.id === "presc-1")!;
    const patient = getPatientsMockData().find((candidate) => candidate.id === "pat-1")!;
    const model = buildPrescriptionDocument(prescription, "أحمد العلوي", patient.patientNumber, cabinet, arSettings);
    const buffer = await renderToBuffer(PrescriptionDocumentPdf({ model }));
    assertValidPdf(buffer);
    writeQaFile("prescription-ar.pdf", buffer);
  });

  it("generates a valid, non-empty payslip PDF", async () => {
    const member = getTeamMembersMockData().find((candidate) => candidate.id === "team-3")!;
    const period = getPayrollPeriodsMockData().find((candidate) => candidate.id === "pp-2026-07")!;
    const entry = getPayrollEntriesMockData().find((candidate) => candidate.id === "pe-2026-07-team-3")!;
    const model = buildPayslipDocument(member, period, entry, cabinet, frSettings);
    const buffer = await renderToBuffer(PayslipDocumentPdf({ model }));
    assertValidPdf(buffer);
    writeQaFile("payslip-fr.pdf", buffer);
  });

  it("prints the QA output directory for manual visual inspection", () => {
    console.info(`\nUI-DOCS-X QA PDFs written to: ${outDir}\n`);
    expect(fs.existsSync(outDir)).toBe(true);
  });
});
