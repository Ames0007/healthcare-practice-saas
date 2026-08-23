import { AlertCircle, CalendarClock, Package, Phone } from "lucide-react";
import type { TodayDashboardData } from "./types";

/**
 * Fixed prototype business date/practitioner (UI-001 §8) — deterministic
 * for tests and manual review, replaced by real session/query data when
 * this becomes a real API-backed screen (see `today-dashboard.tsx` header
 * comment on the mock/API seam).
 */
export const MOCK_BUSINESS_DATE = "2026-08-23";
const PRACTITIONER_NAME = "Dr. Benali";

/** Synthetic Moroccan-context data only — no real patient information. */
export function getTodayMockData(): TodayDashboardData {
  return {
    businessDate: MOCK_BUSINESS_DATE,
    practitionerName: PRACTITIONER_NAME,
    kpis: { total: 8, confirmed: 6, toConfirm: 1, noShow: 1 },
    nextAppointmentId: "apt-4",
    agenda: [
      { id: "apt-1", time: "09:00", patientName: "Fatima Zahra", service: "Consultation", status: "completed" },
      { id: "apt-2", time: "09:30", patientName: "Youssef Amrani", service: "Détartrage", status: "completed" },
      { id: "apt-3", time: "10:00", patientName: "Sara Alaoui", service: "Consultation", status: "in_consultation" },
      { id: "apt-4", time: "10:30", patientName: "Ahmed El Mansouri", service: "Consultation", status: "confirmed" },
      { id: "apt-5", time: "11:00", patientName: "Karim Idrissi", service: "Suivi de traitement", status: "confirmed" },
    ],
    attentionItems: [
      { id: "att-1", translationKey: "aujourdhui.attention.toConfirm", count: 3, tone: "warning", icon: CalendarClock },
      { id: "att-2", translationKey: "aujourdhui.attention.overdue", count: 2, tone: "danger", icon: AlertCircle },
      { id: "att-3", translationKey: "aujourdhui.attention.recall", count: 1, tone: "info", icon: Phone },
      { id: "att-4", translationKey: "aujourdhui.attention.lowStock", count: 2, tone: "warning", icon: Package },
    ],
    finance: { collected: 2400, pending: 800, expenses: 350, caisse: 3050 },
  };
}

/** Empty-day variant (UI-001 §28) — exercised by tests and the `state="empty"` prop. */
export function getEmptyTodayMockData(): TodayDashboardData {
  return {
    businessDate: MOCK_BUSINESS_DATE,
    practitionerName: PRACTITIONER_NAME,
    kpis: { total: 0, confirmed: 0, toConfirm: 0, noShow: 0 },
    nextAppointmentId: null,
    agenda: [],
    attentionItems: [],
    finance: { collected: 0, pending: 0, expenses: 0, caisse: 0 },
  };
}
