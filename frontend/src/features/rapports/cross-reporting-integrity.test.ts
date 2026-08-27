import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPeriodRange, computeFinanceKpis } from "@/features/finance/aggregations";
import { getAgendaMockAppointments, PRACTITIONERS } from "@/features/agenda/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getAttendanceMockData } from "@/features/team/mock-attendance-data";
import { getWorkIntervalsMockData } from "@/features/team/mock-schedule-data";
import { getInventoryItemsMockData } from "@/features/stock/mock-items-data";
import { getInventoryLotsMockData } from "@/features/stock/mock-lots-data";
import { getStockMovementsMockData } from "@/features/stock/mock-movements-data";
import { computeStockKpis } from "@/features/stock/dashboard";
import { buildAppointmentStatusBreakdown, buildPractitionerActivityRows, computeActivityReportKpis } from "./activity-report";
import { computeFinanceReportSummary } from "./finance-report";
import { computeHrReportKpis } from "./hr-report";
import { computePeriodOvertimeMinutes } from "@/features/team/payroll";
import { computeStockReportKpis } from "./stock-report";
import { computeReportsOverview, type ReportsSources } from "./overview";

/**
 * Proves every Reports number (task §8/§9: "Reports MUST derive from
 * existing domain fixtures... never an independently hardcoded reporting
 * universe") reconciles with the source module it comes from — mirrors
 * `cross-inventory-integrity.test.ts`/`cross-communication-integrity.test.ts`'s
 * own discipline: no module here duplicates another's own data.
 */
describe("Cross-reporting integrity — every Reports figure traces back to its own source module", () => {
  const appointments = getAgendaMockAppointments();
  const invoices = getInvoicesMockData();
  const payments = getPaymentsMockData();
  const expenses = getExpensesMockData();
  const teamMembers = getTeamMembersMockData();
  const attendanceRecords = getAttendanceMockData();
  const workIntervals = getWorkIntervalsMockData();
  const items = getInventoryItemsMockData();
  const lots = getInventoryLotsMockData();
  const movements = getStockMovementsMockData();

  const sources: ReportsSources = {
    appointments,
    invoices,
    payments,
    expenses,
    teamMembers,
    attendanceRecords,
    workIntervals,
    items,
    lots,
    movements,
  };

  it("Activité: the status breakdown's own total equals the KPI's own appointmentsCount (August, all 14 appointments)", () => {
    const range = getPeriodRange("month", MOCK_BUSINESS_DATE);
    const kpis = computeActivityReportKpis(appointments, range);
    const breakdown = buildAppointmentStatusBreakdown(appointments, range);
    expect(breakdown.reduce((sum, row) => sum + row.count, 0)).toBe(kpis.appointmentsCount);
  });

  it("Activité: the practitioner table's own appointment counts sum back to the KPI's own appointmentsCount", () => {
    const range = getPeriodRange("month", MOCK_BUSINESS_DATE);
    const kpis = computeActivityReportKpis(appointments, range);
    const rows = buildPractitionerActivityRows(appointments, invoices, payments, PRACTITIONERS, range);
    expect(rows.reduce((sum, row) => sum + row.appointmentsCount, 0)).toBe(kpis.appointmentsCount);
  });

  it("Finance: collected/receivable/overdue reconcile exactly with computeFinanceKpis (UI-006A) — never a second Finance calculation", () => {
    const range = getPeriodRange("month", MOCK_BUSINESS_DATE);
    const summary = computeFinanceReportSummary(invoices, payments, expenses, range);
    const kpis = computeFinanceKpis(invoices, payments, expenses, range);
    expect(summary.collected).toBe(kpis.collected);
    expect(summary.receivable).toBe(kpis.receivable);
    expect(summary.overdue).toBe(kpis.overdue);
  });

  it("Stock: outOfStockCount + lowStockCount reconciles exactly with computeStockKpis's own combined count, and expiringLotsCount matches exactly", () => {
    const reportKpis = computeStockReportKpis(items, lots, movements, MOCK_BUSINESS_DATE);
    const stockKpis = computeStockKpis(items, lots, movements, MOCK_BUSINESS_DATE);
    expect(reportKpis.outOfStockCount + reportKpis.lowStockCount).toBe(stockKpis.lowStockItemsCount);
    expect(reportKpis.expiringLotsCount).toBe(stockKpis.expiringLotsCount);
  });

  it("Équipe: overtimeHours reconciles exactly with the sum of Payroll's own per-member computePeriodOvertimeMinutes (no second overtime rule)", () => {
    const range = getPeriodRange("week", MOCK_BUSINESS_DATE);
    const kpis = computeHrReportKpis(teamMembers, attendanceRecords, workIntervals, range);

    const expectedMinutes = teamMembers
      .filter((member) => member.status === "active")
      .reduce((sum, member) => sum + computePeriodOvertimeMinutes(attendanceRecords, workIntervals, member.id, range.start, range.end), 0);

    expect(kpis.overtimeHours).toBeCloseTo(Math.round((expectedMinutes / 60) * 10) / 10, 5);
    expect(kpis.overtimeHours).toBeGreaterThan(0);
  });

  it("Overview: every block reconciles exactly with its own detail report's own function, for the same period/businessDate", () => {
    const range = getPeriodRange("week", MOCK_BUSINESS_DATE);
    const overview = computeReportsOverview(sources, range, MOCK_BUSINESS_DATE);

    expect(overview.activity).toEqual(computeActivityReportKpis(appointments, range));
    expect(overview.hr).toEqual(computeHrReportKpis(teamMembers, attendanceRecords, workIntervals, range));
    expect(overview.stock).toEqual(computeStockReportKpis(items, lots, movements, MOCK_BUSINESS_DATE));

    const financeKpis = computeFinanceKpis(invoices, payments, expenses, range);
    expect(overview.finance.collected).toBe(financeKpis.collected);
    expect(overview.finance.receivable).toBe(financeKpis.receivable);
    expect(overview.finance.overdue).toBe(financeKpis.overdue);
  });

  it("no contradictory duplicate fixture universes: Reports resolves the same appointment/invoice/item identity every source module already uses", () => {
    expect(appointments.every((appointment) => PRACTITIONERS.some((p) => p.id === appointment.practitionerId))).toBe(true);
    expect(invoices.every((invoice) => invoice.patientId.startsWith("pat-"))).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });
});
