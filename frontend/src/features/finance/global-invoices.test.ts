import { describe, expect, it } from "vitest";
import type { Invoice } from "@/components/domain/finance/types";
import { getFinancialSummary } from "@/features/patients/finance";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { buildGlobalInvoiceRows, matchesGlobalInvoiceFilter, matchesGlobalInvoiceSearch } from "./global-invoices";

describe("buildGlobalInvoiceRows", () => {
  it("orders the whole cabinet operationally: overdue, then partially paid, then paid (newest-issued-first), then cancelled last", () => {
    const rows = buildGlobalInvoiceRows(getInvoicesMockData(), getPatientsMockData());

    expect(rows.map((row) => row.invoice.id)).toEqual(["inv-3", "inv-1", "inv-1b", "inv-2", "inv-1c"]);
  });

  it("resolves patient name and patient number from the shared patient fixtures", () => {
    const rows = buildGlobalInvoiceRows(getInvoicesMockData(), getPatientsMockData());
    const overdueRow = rows.find((row) => row.invoice.id === "inv-3")!;

    expect(overdueRow.patientName).toBe("Mehdi Berrada");
    expect(overdueRow.patientNumber).toBe("PAT-00289");
  });

  it("derives the next payable installment via getPayableInstallments, never hardcoded", () => {
    const rows = buildGlobalInvoiceRows(getInvoicesMockData(), getPatientsMockData());

    const partial = rows.find((row) => row.invoice.id === "inv-1")!;
    expect(partial.nextInstallment).toEqual({
      id: "inv-1-i4",
      invoiceId: "inv-1",
      sequenceNumber: 4,
      dueDate: "2026-09-01",
      amount: 500,
      status: "due",
    });

    const overdue = rows.find((row) => row.invoice.id === "inv-3")!;
    expect(overdue.nextInstallment).toMatchObject({ dueDate: "2026-08-05", amount: 2200, status: "overdue" });

    // Invoices with no installment schedule at all (inv-1b, inv-2) have no next installment.
    const fullyPaid = rows.find((row) => row.invoice.id === "inv-1b")!;
    expect(fullyPaid.nextInstallment).toBeNull();
  });

  it("assigns a distinct operational priority per InvoiceStatus (lower = more urgent)", () => {
    const rows = buildGlobalInvoiceRows(getInvoicesMockData(), getPatientsMockData());
    const byId = new Map(rows.map((row) => [row.invoice.id, row.operationalPriority]));

    expect(byId.get("inv-3")).toBeLessThan(byId.get("inv-1")!); // overdue < partially_paid
    expect(byId.get("inv-1")!).toBeLessThan(byId.get("inv-1b")!); // partially_paid < paid
    expect(byId.get("inv-1b")!).toBeLessThan(byId.get("inv-1c")!); // paid < cancelled
  });
});

describe("matchesGlobalInvoiceSearch", () => {
  const rows = buildGlobalInvoiceRows(getInvoicesMockData(), getPatientsMockData());
  const ahmedInvoice = rows.find((row) => row.invoice.id === "inv-1")!;

  it("matches by patient full name, case-insensitively", () => {
    expect(matchesGlobalInvoiceSearch(ahmedInvoice, "ahmed")).toBe(true);
    expect(matchesGlobalInvoiceSearch(ahmedInvoice, "AHMED EL MANSOURI")).toBe(true);
    expect(matchesGlobalInvoiceSearch(ahmedInvoice, "mehdi")).toBe(false);
  });

  it("matches by patient number, case-insensitively", () => {
    expect(matchesGlobalInvoiceSearch(ahmedInvoice, "pat-00281")).toBe(true);
    expect(matchesGlobalInvoiceSearch(ahmedInvoice, "PAT-00281")).toBe(true);
  });

  it("matches by invoice number, case-insensitively", () => {
    expect(matchesGlobalInvoiceSearch(ahmedInvoice, "fac-2026-00142")).toBe(true);
    expect(matchesGlobalInvoiceSearch(ahmedInvoice, "00142")).toBe(true);
  });

  it("an empty/blank query matches everything", () => {
    expect(matchesGlobalInvoiceSearch(ahmedInvoice, "")).toBe(true);
    expect(matchesGlobalInvoiceSearch(ahmedInvoice, "   ")).toBe(true);
  });
});

describe("matchesGlobalInvoiceFilter", () => {
  function makeInvoice(overrides: Partial<Invoice>): Invoice {
    return {
      id: "inv-x",
      patientId: "pat-x",
      invoiceNumber: "FAC-2026-99999",
      issuedDate: "2026-08-01",
      status: "issued",
      currency: "MAD",
      description: "test",
      practitionerName: "Dr. Test",
      totalAmount: 1000,
      paidAmount: 0,
      remainingAmount: 1000,
      lines: [],
      installments: [],
      ...overrides,
    };
  }

  const row = (invoiceOverrides: Partial<Invoice>) => ({
    invoice: makeInvoice(invoiceOverrides),
    patientId: "pat-x",
    patientName: "Test Patient",
    patientNumber: "PAT-00000",
    nextInstallment: null,
    operationalPriority: 0,
  });

  it("'all' matches every status including cancelled", () => {
    for (const status of ["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"] as const) {
      expect(matchesGlobalInvoiceFilter(row({ status }), "all")).toBe(true);
    }
  });

  it("'toPay' matches only issued invoices with a positive remaining balance", () => {
    expect(matchesGlobalInvoiceFilter(row({ status: "issued", remainingAmount: 1000 }), "toPay")).toBe(true);
    expect(matchesGlobalInvoiceFilter(row({ status: "issued", remainingAmount: 0 }), "toPay")).toBe(false);
    expect(matchesGlobalInvoiceFilter(row({ status: "partially_paid" }), "toPay")).toBe(false);
  });

  it("'partial' matches only partially_paid", () => {
    expect(matchesGlobalInvoiceFilter(row({ status: "partially_paid" }), "partial")).toBe(true);
    expect(matchesGlobalInvoiceFilter(row({ status: "issued" }), "partial")).toBe(false);
  });

  it("'paid' matches only paid", () => {
    expect(matchesGlobalInvoiceFilter(row({ status: "paid" }), "paid")).toBe(true);
    expect(matchesGlobalInvoiceFilter(row({ status: "partially_paid" }), "paid")).toBe(false);
  });

  it("'overdue' matches only overdue", () => {
    expect(matchesGlobalInvoiceFilter(row({ status: "overdue" }), "overdue")).toBe(true);
    expect(matchesGlobalInvoiceFilter(row({ status: "issued" }), "overdue")).toBe(false);
  });
});

describe("financial summary integrity (reuses getFinancialSummary, UI-004D)", () => {
  it("the cabinet-wide unfiltered summary matches getFinancialSummary's own output exactly", () => {
    const invoices = getInvoicesMockData();
    const expected = getFinancialSummary(invoices);

    expect(expected).toEqual({ totalAmount: 7500, paidAmount: 3800, remainingAmount: 3700, overdueAmount: 2200 });
  });
});
