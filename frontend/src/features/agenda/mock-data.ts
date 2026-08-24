import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { addDaysIso, getWeekStart } from "./format";
import type { AgendaAppointment, AgendaPatient, AgendaPractitioner } from "./types";

/** Reuses UI-001's fixed prototype "today" so both screens share one anchor date. */
export { MOCK_BUSINESS_DATE };

/** Fixed mock "now" for deterministic waiting-room durations (§39) — no ticking timers. */
export const MOCK_NOW_TIME = "09:15";

export const PRACTITIONERS: AgendaPractitioner[] = [
  { id: "pr-1", name: "Dr. Benali" },
  { id: "pr-2", name: "Dr. Amal" },
];

export const PATIENTS: AgendaPatient[] = [
  { id: "pat-1", name: "Ahmed El Mansouri", phone: "06 12 34 56 78", patientNumber: "PAT-00281" },
  { id: "pat-2", name: "Sara Alaoui", phone: "06 23 45 67 89", patientNumber: "PAT-00147" },
  { id: "pat-3", name: "Fatima Zahra", phone: "06 34 56 78 90", patientNumber: "PAT-00092" },
  { id: "pat-4", name: "Youssef Amrani", phone: "06 45 67 89 01", patientNumber: "PAT-00203" },
  { id: "pat-5", name: "Karim Idrissi", phone: "06 56 78 90 12", patientNumber: "PAT-00318" },
  { id: "pat-6", name: "Nadia Amrani", phone: "06 67 89 01 23", patientNumber: "PAT-00355" },
  { id: "pat-7", name: "Omar El Fassi", phone: "06 78 90 12 34", patientNumber: "PAT-00410" },
  { id: "pat-8", name: "Hicham Bennani", phone: "06 89 01 23 45", patientNumber: "PAT-00462" },
  { id: "pat-9", name: "Salma Tazi", phone: "06 90 12 34 56", patientNumber: "PAT-00509" },
];

export const SERVICES = ["Consultation", "Contrôle", "Détartrage", "Séance de kinésithérapie", "Suivi"];

const addDays = addDaysIso;

/** Monday of the mock week containing the anchor date, for Week View. */
export function getMockWeekStart(): string {
  return getWeekStart(MOCK_BUSINESS_DATE);
}

const [BENALI, AMAL] = PRACTITIONERS;
const [AHMED, SARA, FATIMA, YOUSSEF, KARIM, NADIA, OMAR, HICHAM, SALMA] = PATIENTS;

/**
 * Synthetic appointments only (§8/§53). §8's seven anchor-day appointments
 * are reproduced exactly; two more (Hicham/Salma, already-arrived/waiting)
 * are added so Waiting Room has arrived/waiting rows to demonstrate, and a
 * few appointments on neighboring days populate Week View.
 */
export function getAgendaMockAppointments(): AgendaAppointment[] {
  return [
    {
      id: "apt-1",
      date: MOCK_BUSINESS_DATE,
      schedulingType: "exact",
      time: "08:55",
      durationMinutes: 30,
      patientId: SALMA.id,
      patientName: SALMA.name,
      patientPhone: SALMA.phone,
      patientNumber: SALMA.patientNumber,
      practitionerId: BENALI.id,
      practitionerName: BENALI.name,
      service: "Contrôle",
      status: "waiting",
      arrivedAt: "08:55",
    },
    {
      id: "apt-2",
      date: MOCK_BUSINESS_DATE,
      schedulingType: "exact",
      time: "09:00",
      durationMinutes: 30,
      patientId: FATIMA.id,
      patientName: FATIMA.name,
      practitionerId: BENALI.id,
      practitionerName: BENALI.name,
      service: "Consultation",
      status: "completed",
    },
    {
      id: "apt-3",
      date: MOCK_BUSINESS_DATE,
      schedulingType: "exact",
      time: "09:05",
      durationMinutes: 30,
      patientId: HICHAM.id,
      patientName: HICHAM.name,
      patientPhone: HICHAM.phone,
      patientNumber: HICHAM.patientNumber,
      practitionerId: AMAL.id,
      practitionerName: AMAL.name,
      service: "Consultation",
      status: "arrived",
      arrivedAt: "09:05",
    },
    {
      id: "apt-4",
      date: MOCK_BUSINESS_DATE,
      schedulingType: "exact",
      time: "09:30",
      durationMinutes: 30,
      patientId: YOUSSEF.id,
      patientName: YOUSSEF.name,
      practitionerId: AMAL.id,
      practitionerName: AMAL.name,
      service: "Détartrage",
      status: "completed",
    },
    {
      id: "apt-5",
      date: MOCK_BUSINESS_DATE,
      schedulingType: "exact",
      time: "10:00",
      durationMinutes: 30,
      patientId: SARA.id,
      patientName: SARA.name,
      patientPhone: SARA.phone,
      patientNumber: SARA.patientNumber,
      practitionerId: BENALI.id,
      practitionerName: BENALI.name,
      service: "Contrôle",
      status: "in_consultation",
    },
    {
      id: "apt-6",
      date: MOCK_BUSINESS_DATE,
      schedulingType: "exact",
      time: "10:30",
      durationMinutes: 30,
      patientId: AHMED.id,
      patientName: AHMED.name,
      patientPhone: AHMED.phone,
      patientNumber: AHMED.patientNumber,
      practitionerId: BENALI.id,
      practitionerName: BENALI.name,
      service: "Consultation",
      status: "confirmed",
    },
    {
      id: "apt-7",
      date: MOCK_BUSINESS_DATE,
      schedulingType: "window",
      time: "11:00",
      endTime: "11:30",
      patientId: KARIM.id,
      patientName: KARIM.name,
      practitionerId: AMAL.id,
      practitionerName: AMAL.name,
      service: "Séance de kinésithérapie",
      status: "confirmed",
    },
    {
      id: "apt-8",
      date: MOCK_BUSINESS_DATE,
      schedulingType: "exact",
      time: "14:00",
      durationMinutes: 30,
      patientId: NADIA.id,
      patientName: NADIA.name,
      practitionerId: BENALI.id,
      practitionerName: BENALI.name,
      service: "Consultation",
      status: "to_confirm",
    },
    {
      id: "apt-9",
      date: MOCK_BUSINESS_DATE,
      schedulingType: "exact",
      time: "15:30",
      durationMinutes: 30,
      patientId: OMAR.id,
      patientName: OMAR.name,
      practitionerId: AMAL.id,
      practitionerName: AMAL.name,
      service: "Contrôle",
      status: "no_show",
    },
    {
      id: "apt-10",
      date: addDays(MOCK_BUSINESS_DATE, -2),
      schedulingType: "exact",
      time: "09:00",
      durationMinutes: 30,
      patientId: SARA.id,
      patientName: SARA.name,
      practitionerId: BENALI.id,
      practitionerName: BENALI.name,
      service: "Suivi",
      status: "completed",
    },
    {
      id: "apt-11",
      date: addDays(MOCK_BUSINESS_DATE, -1),
      schedulingType: "window",
      time: "10:00",
      endTime: "10:30",
      patientId: KARIM.id,
      patientName: KARIM.name,
      practitionerId: AMAL.id,
      practitionerName: AMAL.name,
      service: "Séance de kinésithérapie",
      status: "completed",
    },
    {
      id: "apt-12",
      date: addDays(MOCK_BUSINESS_DATE, 1),
      schedulingType: "exact",
      time: "09:30",
      durationMinutes: 45,
      patientId: FATIMA.id,
      patientName: FATIMA.name,
      practitionerId: BENALI.id,
      practitionerName: BENALI.name,
      service: "Détartrage",
      status: "confirmed",
    },
    {
      id: "apt-13",
      date: addDays(MOCK_BUSINESS_DATE, 1),
      schedulingType: "exact",
      time: "11:00",
      durationMinutes: 30,
      patientId: OMAR.id,
      patientName: OMAR.name,
      practitionerId: AMAL.id,
      practitionerName: AMAL.name,
      service: "Contrôle",
      status: "to_confirm",
    },
    {
      id: "apt-14",
      date: addDays(MOCK_BUSINESS_DATE, 3),
      schedulingType: "exact",
      time: "16:00",
      durationMinutes: 30,
      patientId: AHMED.id,
      patientName: AHMED.name,
      practitionerId: BENALI.id,
      practitionerName: BENALI.name,
      service: "Suivi",
      status: "requested",
    },
  ];
}

export function getEmptyAgendaMockAppointments(): AgendaAppointment[] {
  return [];
}
