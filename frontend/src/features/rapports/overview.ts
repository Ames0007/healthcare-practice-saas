import type { AgendaAppointment } from "@/features/agenda/types";
import type { CabinetExpense, Invoice, Payment } from "@/components/domain/finance/types";
import type { AttendanceRecord, TeamMember, WorkInterval } from "@/components/domain/team/types";
import type { InventoryItem, InventoryLot, StockMovement } from "@/components/domain/stock/types";
import type { ReportsOverview } from "@/components/domain/reports/types";
import type { PeriodRange } from "@/features/finance/aggregations";
import { computeFinanceKpis } from "@/features/finance/aggregations";
import { computeActivityReportKpis } from "./activity-report";
import { computeHrReportKpis } from "./hr-report";
import { computeStockReportKpis } from "./stock-report";

/** Every fixture array the Overview draws from — a plumbing container, not a new business entity (each field is the same array its own detail report reads). */
export interface ReportsSources {
  appointments: AgendaAppointment[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: CabinetExpense[];
  teamMembers: TeamMember[];
  attendanceRecords: AttendanceRecord[];
  workIntervals: WorkInterval[];
  items: InventoryItem[];
  lots: InventoryLot[];
  movements: StockMovement[];
}

/**
 * The task's own Overview wireframe (§11): four category blocks, each a
 * subset of its own detail report's KPIs. Every number here is computed by
 * the exact same function its own detail report page calls — proven by
 * `cross-reporting-integrity.test.ts` — never a second, independently
 * hardcoded total (task §8/§9: "Reports MUST derive from existing domain
 * fixtures. Do NOT create an independent fake reporting universe.").
 */
export function computeReportsOverview(sources: ReportsSources, range: PeriodRange, businessDate: string): ReportsOverview {
  const activity = computeActivityReportKpis(sources.appointments, range);
  const financeKpis = computeFinanceKpis(sources.invoices, sources.payments, sources.expenses, range);
  const hr = computeHrReportKpis(sources.teamMembers, sources.attendanceRecords, sources.workIntervals, range);
  const stock = computeStockReportKpis(sources.items, sources.lots, sources.movements, businessDate);

  return {
    activity,
    finance: { collected: financeKpis.collected, receivable: financeKpis.receivable, overdue: financeKpis.overdue },
    hr,
    stock,
  };
}
