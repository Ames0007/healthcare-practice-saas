import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPeriodRange } from "@/features/finance/aggregations";
import { getAgendaMockAppointments, PRACTITIONERS } from "@/features/agenda/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { buildAppointmentStatusBreakdown, buildPractitionerActivityRows, computeActivityReportKpis } from "./activity-report";

describe("computeActivityReportKpis (real fixtures, today)", () => {
  const range = getPeriodRange("today", MOCK_BUSINESS_DATE);
  const kpis = computeActivityReportKpis(getAgendaMockAppointments(), range);

  it("counts the 9 appointments dated the business date (apt-1..apt-9)", () => {
    expect(kpis.appointmentsCount).toBe(9);
  });

  it("counts 2 distinct patients seen (apt-2 Fatima + apt-4 Youssef, both completed)", () => {
    expect(kpis.patientsSeenCount).toBe(2);
  });

  it("computes the no-show rate as 1/9 rounded to one decimal (apt-9 is the only no-show)", () => {
    expect(kpis.noShowRatePercent).toBeCloseTo(11.1, 5);
  });

  it("returns 0% when there were no appointments at all in the period", () => {
    const empty = computeActivityReportKpis([], range);
    expect(empty.noShowRatePercent).toBe(0);
    expect(empty.appointmentsCount).toBe(0);
  });
});

describe("buildAppointmentStatusBreakdown (real fixtures, today)", () => {
  const range = getPeriodRange("today", MOCK_BUSINESS_DATE);
  const rows = buildAppointmentStatusBreakdown(getAgendaMockAppointments(), range);

  it("only includes statuses actually present, worst/later-sequence never invented", () => {
    const statuses = rows.map((row) => row.status);
    expect(statuses).toEqual(["to_confirm", "confirmed", "arrived", "waiting", "in_consultation", "completed", "no_show"]);
  });

  it("every row's count sums back to the KPI's own appointmentsCount (no invented total)", () => {
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    expect(total).toBe(9);
  });

  it("counts the 2 completed appointments exactly (apt-2, apt-4)", () => {
    expect(rows.find((row) => row.status === "completed")?.count).toBe(2);
  });
});

describe("buildPractitionerActivityRows (real fixtures, today)", () => {
  const range = getPeriodRange("today", MOCK_BUSINESS_DATE);
  const rows = buildPractitionerActivityRows(
    getAgendaMockAppointments(),
    getInvoicesMockData(),
    getPaymentsMockData(),
    PRACTITIONERS,
    range,
  );

  it("one row per practitioner, appointment counts split exactly (Benali 5, Amal 4)", () => {
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.practitionerId === "pr-1")?.appointmentsCount).toBe(5);
    expect(rows.find((row) => row.practitionerId === "pr-2")?.appointmentsCount).toBe(4);
  });

  it("splits completed/no-show correctly (Benali: 1 completed/0 no-show; Amal: 1 completed/1 no-show)", () => {
    const benali = rows.find((row) => row.practitionerId === "pr-1")!;
    const amal = rows.find((row) => row.practitionerId === "pr-2")!;
    expect(benali.completedCount).toBe(1);
    expect(benali.noShowCount).toBe(0);
    expect(amal.completedCount).toBe(1);
    expect(amal.noShowCount).toBe(1);
  });

  it("sums appointment counts back to the KPI's own total (5 + 4 = 9)", () => {
    const total = rows.reduce((sum, row) => sum + row.appointmentsCount, 0);
    expect(total).toBe(9);
  });

  it("collectedAmount is 0 for a practitioner with no posted payments in the period (today has none)", () => {
    expect(rows.every((row) => row.collectedAmount === 0)).toBe(true);
  });
});
