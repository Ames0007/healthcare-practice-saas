import type { CabinetService } from "@/components/domain/settings/types";
import { SERVICES } from "@/features/agenda/mock-data";

/**
 * Centralized synthetic Services & Pricing fixture (UI-010ABC Gate 3). Each
 * `name` is taken verbatim from Agenda's own pre-existing `SERVICES` string
 * array — the one scattered service list already used across Agenda's
 * appointment-creation form — rather than an unrelated new catalog (task
 * §5: "provide them a coherent configuration home"). Duration/price/
 * scheduling-mode are new information this task adds (Agenda's own array
 * carries none of that), chosen to be realistic for a small Moroccan
 * cabinet (Spec #9 Screen 45's own worked example: "Consultation — 400 MAD
 * — 30 min" is reproduced exactly).
 */
export function getCabinetServicesMockData(): CabinetService[] {
  const [consultation, controle, detartrage, kinesitherapie, suivi] = SERVICES;

  return [
    { id: "svc-1", name: consultation, durationMinutes: 30, price: 400, schedulingMode: "exact", active: true },
    { id: "svc-2", name: controle, durationMinutes: 20, price: 250, schedulingMode: "exact", active: true },
    { id: "svc-3", name: detartrage, durationMinutes: 45, price: 350, schedulingMode: "exact", active: true },
    { id: "svc-4", name: kinesitherapie, durationMinutes: 45, price: 300, schedulingMode: "window", active: true },
    { id: "svc-5", name: suivi, durationMinutes: 20, price: 200, schedulingMode: "exact", active: false },
  ];
}

export function getEmptyCabinetServicesMockData(): CabinetService[] {
  return [];
}
