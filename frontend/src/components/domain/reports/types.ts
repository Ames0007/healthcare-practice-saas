import type { AppointmentStatus } from "@/components/domain/appointments/types";
import type { MoneyAmount } from "@/components/domain/finance/types";

/**
 * Cabinet-wide appointment/patient activity KPIs for a selected period
 * (Spec #2 §42.1). "Confirmation rate" is deliberately NOT included here —
 * the spec names it as a KPI label with no defined formula anywhere in the
 * approved specifications, so this task does not invent one (CLAUDE.md
 * §3); `buildAppointmentStatusBreakdown` (features/rapports/activity-report.ts)
 * surfaces the same underlying information as objective per-status counts
 * instead.
 */
export interface ActivityReportKpis {
  appointmentsCount: number;
  /** Distinct patients with at least one `completed` appointment in the period. */
  patientsSeenCount: number;
  /** Percentage, e.g. `6.2` meaning 6.2% — `no_show` count / `appointmentsCount` over the same period. `0` when there were no appointments. */
  noShowRatePercent: number;
}

/** One appointment status's own count within the selected period, worst-first via `APPOINTMENT_STATUS_ORDER`. */
export interface AppointmentStatusBreakdownRow {
  status: AppointmentStatus;
  count: number;
}

/**
 * One practitioner's own activity + collections for the selected period
 * (Spec #3 WF-72: "Appointments, Completed, No-shows, Amount collected").
 * Commission and active-patient counts are deliberately excluded — both
 * already have their own dedicated Équipe screens (CommissionRule,
 * Patient 360°), so repeating them here would be scope creep over data
 * that already has a home (task §5: "do not add every domain merely
 * because data exists").
 */
export interface PractitionerActivityRow {
  practitionerId: string;
  practitionerName: string;
  appointmentsCount: number;
  completedCount: number;
  noShowCount: number;
  collectedAmount: MoneyAmount;
}

/**
 * Cabinet-wide financial KPIs for the selected period (Spec #2 §42.2,
 * Spec #1 §17.1). Extends the existing Finance dashboard's own
 * `FinanceKpis` (collected/receivable/overdue/disbursed, reused unmodified
 * via `computeFinanceKpis`) with the two figures that dashboard does not
 * surface: period-scoped invoiced amount and the resulting collection
 * rate — both newly computed here, never a second independent "collected"
 * or "receivable" figure.
 */
export interface FinanceReportSummary {
  invoiced: MoneyAmount;
  collected: MoneyAmount;
  receivable: MoneyAmount;
  overdue: MoneyAmount;
  /** Percentage — `collected / invoiced` for the same period. `0` when nothing was invoiced. */
  collectionRatePercent: number;
}

/** Cabinet-wide HR KPIs for the selected period (Spec #2 §42.4, task's own Overview wireframe). */
export interface HrReportKpis {
  /** Sum of every attendance record's own worked duration in the period, in hours (one decimal). */
  workedHours: number;
  /** Count of attendance records in the period where check-in occurred after the member's own expected start. */
  lateCount: number;
  /** Sum of every attendance record's own overtime duration in the period, in hours (one decimal) — reuses `computePeriodOvertimeMinutes` per member, never a second overtime rule. */
  overtimeHours: number;
  /** Active team members, not period-scoped (a headcount is a current fact, not a period activity). */
  activeHeadcount: number;
}

/**
 * Cabinet-wide inventory attention KPIs for the report (Spec #2 §42.5).
 * Deliberately not the same shape as `features/stock/dashboard.ts`'s own
 * `StockKpis` (which combines out_of_stock/critical/low into one
 * `lowStockItemsCount`): the task's own Overview wireframe asks for
 * "Articles en rupture" and "Stock faible" as two separate numbers, so
 * this partitions the same `StockAttentionStatus` rows `computeStockKpis`
 * already reads (`out_of_stock` alone vs. `critical`+`low`) rather than
 * changing Stock's own existing dashboard shape (task §5: "do not perform
 * a massive refactor of previous modules").
 */
export interface StockReportKpis {
  outOfStockCount: number;
  lowStockCount: number;
  expiringLotsCount: number;
}

/** The four category blocks the task's own Overview wireframe defines (§11), each a subset of its own detail report's KPIs. */
export interface ReportsOverview {
  activity: ActivityReportKpis;
  finance: Pick<FinanceReportSummary, "collected" | "receivable" | "overdue">;
  hr: HrReportKpis;
  stock: StockReportKpis;
}
