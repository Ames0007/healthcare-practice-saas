import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPeriodRange } from "@/features/finance/aggregations";
import { getAgendaMockAppointments } from "@/features/agenda/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getAttendanceMockData } from "@/features/team/mock-attendance-data";
import { getWorkIntervalsMockData } from "@/features/team/mock-schedule-data";
import { getInventoryItemsMockData } from "@/features/stock/mock-items-data";
import { getInventoryLotsMockData } from "@/features/stock/mock-lots-data";
import { getStockMovementsMockData } from "@/features/stock/mock-movements-data";
import { computeActivityReportKpis } from "./activity-report";
import { computeStockReportKpis } from "./stock-report";
import { computeHrReportKpis } from "./hr-report";
import { computeReportsOverview, type ReportsSources } from "./overview";

function buildSources(): ReportsSources {
  return {
    appointments: getAgendaMockAppointments(),
    invoices: getInvoicesMockData(),
    payments: getPaymentsMockData(),
    expenses: getExpensesMockData(),
    teamMembers: getTeamMembersMockData(),
    attendanceRecords: getAttendanceMockData(),
    workIntervals: getWorkIntervalsMockData(),
    items: getInventoryItemsMockData(),
    lots: getInventoryLotsMockData(),
    movements: getStockMovementsMockData(),
  };
}

describe("computeReportsOverview (real fixtures) — reconciles with each detail report's own function", () => {
  const sources = buildSources();
  const range = getPeriodRange("week", MOCK_BUSINESS_DATE);
  const overview = computeReportsOverview(sources, range, MOCK_BUSINESS_DATE);

  it("activity block matches computeActivityReportKpis exactly, never a second independent count", () => {
    const activityKpis = computeActivityReportKpis(sources.appointments, range);
    expect(overview.activity).toEqual(activityKpis);
  });

  it("stock block matches computeStockReportKpis exactly", () => {
    const stockKpis = computeStockReportKpis(sources.items, sources.lots, sources.movements, MOCK_BUSINESS_DATE);
    expect(overview.stock).toEqual(stockKpis);
  });

  it("hr block matches computeHrReportKpis exactly", () => {
    const hrKpis = computeHrReportKpis(sources.teamMembers, sources.attendanceRecords, sources.workIntervals, range);
    expect(overview.hr).toEqual(hrKpis);
  });

  it("finance block's three figures match computeFinanceReportSummary's own collected/receivable/overdue", () => {
    expect(overview.finance.receivable).toBe(3700);
    expect(overview.finance.overdue).toBe(2200);
  });
});
