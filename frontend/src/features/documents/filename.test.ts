import { describe, expect, it } from "vitest";
import { buildDocumentFilename, sanitizeFilenameSegment } from "./filename";

describe("sanitizeFilenameSegment (UI-DOCS-X §11)", () => {
  it("keeps plain alphanumeric references untouched", () => {
    expect(sanitizeFilenameSegment("FAC-2026-00143")).toBe("FAC-2026-00143");
  });

  it("collapses unsafe filesystem characters into a single dash", () => {
    expect(sanitizeFilenameSegment("FAC/2026\\00143:*?\"<>|")).toBe("FAC-2026-00143");
  });

  it("trims leading/trailing separators", () => {
    expect(sanitizeFilenameSegment("  FAC-2026  ")).toBe("FAC-2026");
  });
});

describe("buildDocumentFilename (task §11 examples)", () => {
  it("matches the invoice example exactly", () => {
    expect(buildDocumentFilename("Facture", "FAC-2026-00143")).toBe("Facture-FAC-2026-00143.pdf");
  });

  it("matches the receipt example exactly", () => {
    expect(buildDocumentFilename("Recu", "REC-2026-00383")).toBe("Recu-REC-2026-00383.pdf");
  });

  it("matches the prescription (patient number + date) example exactly", () => {
    expect(buildDocumentFilename("Ordonnance", "PAT-00281", "2026-08-29")).toBe("Ordonnance-PAT-00281-2026-08-29.pdf");
  });

  it("matches the payslip (employee number + period) example exactly", () => {
    expect(buildDocumentFilename("Bulletin-Paie", "EMP-0003", "2026-08")).toBe("Bulletin-Paie-EMP-0003-2026-08.pdf");
  });

  it("never leaks an internal database-like id when a human reference is used", () => {
    const filename = buildDocumentFilename("Facture", "FAC-2026-00143");
    expect(filename).not.toMatch(/inv-\d/);
  });
});
