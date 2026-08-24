import type { LucideIcon } from "lucide-react";
import type { StatusTone } from "@/components/ui/status-badge";
import type { AppointmentStatus } from "@/components/domain/appointments/types";

/**
 * The full state machine lives in the domain layer (Spec #2 §57.1 / Spec
 * #3 §3.1 / CLAUDE.md §16) since Agenda (UI-002) needs it too. Aujourd'hui
 * only ever assigns 6 of its 11 members to mock data.
 */
export type { AppointmentStatus };

export interface TodayAppointment {
  id: string;
  time: string;
  /** Present only for arrival-window appointments (CLAUDE.md §15). */
  endTime?: string;
  patientName: string;
  service: string;
  status: AppointmentStatus;
  practitioner?: string;
}

export interface TodayKpis {
  total: number;
  confirmed: number;
  toConfirm: number;
  noShow: number;
}

export interface AttentionItemData {
  id: string;
  /** i18n key resolved with `{ count }`, e.g. "aujourdhui.attention.toConfirm". */
  translationKey: string;
  count: number;
  tone: StatusTone;
  icon: LucideIcon;
}

/** Operational cash snapshot (CLAUDE.md §19/§26) — MAD only, never "profit". */
export interface TodayFinance {
  collected: number;
  pending: number;
  expenses: number;
  caisse: number;
}

export interface TodayDashboardData {
  /** ISO date (fixed for prototype determinism, Spec #9 §11). */
  businessDate: string;
  practitionerName: string;
  kpis: TodayKpis;
  agenda: TodayAppointment[];
  nextAppointmentId: string | null;
  attentionItems: AttentionItemData[];
  finance: TodayFinance;
}
