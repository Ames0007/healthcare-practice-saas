"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import type { AppointmentStatus } from "@/components/domain/appointments/types";
import { AgendaHeader, type AgendaActiveView, type AgendaViewMode } from "./components/agenda-header";
import { DayView } from "./components/day-view";
import { WeekView } from "./components/week-view";
import { WaitingRoom } from "./components/waiting-room";
import { AppointmentDrawer } from "./components/appointment-drawer";
import { AppointmentFormDialog, type AppointmentFormResult } from "./components/appointment-form-dialog";
import { RescheduleDialog, type RescheduleDraft, type RescheduleResult } from "./components/reschedule-dialog";
import { CancelConfirmDialog } from "./components/cancel-confirm-dialog";
import { NoShowConfirmDialog } from "./components/no-show-confirm-dialog";
import { AgendaSkeleton } from "./components/agenda-skeleton";
import {
  MOCK_BUSINESS_DATE,
  MOCK_NOW_TIME,
  PATIENTS,
  PRACTITIONERS,
  SERVICES,
  getAgendaMockAppointments,
  getEmptyAgendaMockAppointments,
} from "./mock-data";
import { addDaysIso, addMinutesToTime, formatBusinessDate, formatWeekRangeLabel, getWeekDates, getWeekStart } from "./format";
import { findConflict, suggestAlternativeTimes } from "./conflict";
import type { AgendaAppointment, AppointmentDraft } from "./types";

export type AgendaPageState = "loading" | "loaded" | "empty" | "error";

export interface AgendaPageProps {
  state?: AgendaPageState;
  onRetry?: () => void;
}

interface FormDialogState {
  mode: "create" | "edit";
  editingId?: string;
  initialValues?: Partial<AppointmentDraft>;
}

/**
 * Agenda & appointment prototype (UI-002). Owns the single centralized
 * appointment array (§16/§40/§53) — the drawer, day/week views and
 * Waiting Room all read from and update this one list, so a status
 * change made anywhere is reflected everywhere without a separate
 * synchronization step. Mock data only; nothing persists across refresh.
 */
export function AgendaPage({ state = "loaded", onRetry }: AgendaPageProps) {
  const { t, locale } = useLocale();
  const [appointments, setAppointments] = useState<AgendaAppointment[]>(() =>
    state === "empty" ? getEmptyAgendaMockAppointments() : getAgendaMockAppointments(),
  );

  const [viewMode, setViewMode] = useState<AgendaViewMode>("day");
  const [activeView, setActiveView] = useState<AgendaActiveView>("agenda");
  const [selectedDate, setSelectedDate] = useState(MOCK_BUSINESS_DATE);
  const [practitionerFilter, setPractitionerFilter] = useState("all");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [formDialog, setFormDialog] = useState<FormDialogState | null>(null);
  const [formDialogKey, setFormDialogKey] = useState(0);
  const [rescheduleTarget, setRescheduleTarget] = useState<AgendaAppointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AgendaAppointment | null>(null);
  const [noShowTarget, setNoShowTarget] = useState<AgendaAppointment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const nextIdRef = useRef(1);

  if (state === "loading") {
    return <AgendaSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("agenda.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("agenda.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const matchesPractitioner = (appointment: AgendaAppointment) =>
    practitionerFilter === "all" || appointment.practitionerId === practitionerFilter;

  const dayAppointments = appointments.filter((a) => a.date === selectedDate && matchesPractitioner(a));
  const weekStartIso = getWeekStart(selectedDate);
  const weekDates = getWeekDates(weekStartIso);
  const weekAppointments = appointments.filter((a) => weekDates.includes(a.date) && matchesPractitioner(a));
  const todayAppointments = appointments.filter((a) => a.date === MOCK_BUSINESS_DATE && matchesPractitioner(a));
  const selectedAppointment = appointments.find((a) => a.id === selectedAppointmentId) ?? null;
  const dateLabel = viewMode === "day" ? formatBusinessDate(selectedDate, locale) : formatWeekRangeLabel(weekStartIso, locale);

  function handleNavigate(direction: "prev" | "next" | "today") {
    if (direction === "today") {
      setSelectedDate(MOCK_BUSINESS_DATE);
      return;
    }
    const delta = viewMode === "week" ? 7 : 1;
    setSelectedDate((current) => addDaysIso(current, direction === "next" ? delta : -delta));
  }

  function openCreateForm(initialValues?: Partial<AppointmentDraft>) {
    setFormDialog({ mode: "create", initialValues: { date: selectedDate, ...initialValues } });
    setFormDialogKey((key) => key + 1);
  }

  function openEditForm(appointment: AgendaAppointment) {
    setSelectedAppointmentId(null);
    setFormDialog({
      mode: "edit",
      editingId: appointment.id,
      initialValues: {
        patientId: appointment.patientId,
        practitionerId: appointment.practitionerId,
        service: appointment.service,
        date: appointment.date,
        schedulingType: appointment.schedulingType,
        time: appointment.time,
        endTime: appointment.endTime ?? addMinutesToTime(appointment.time, 30),
        durationMinutes: appointment.durationMinutes ?? 30,
        note: appointment.note ?? "",
      },
    });
    setFormDialogKey((key) => key + 1);
  }

  function handlePrimaryAction(id: string, targetStatus: AppointmentStatus) {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status: targetStatus, arrivedAt: targetStatus === "arrived" ? MOCK_NOW_TIME : appointment.arrivedAt }
          : appointment,
      ),
    );
    setToastMessage(t("agenda.toast.statusUpdated"));
  }

  function handleFormSubmit(draft: AppointmentDraft): AppointmentFormResult {
    const editingId = formDialog?.mode === "edit" ? formDialog.editingId : undefined;
    const conflict = findConflict(appointments, draft, editingId);
    if (conflict) {
      return { ok: false, suggestions: suggestAlternativeTimes(appointments, draft, 3) };
    }

    const patient = PATIENTS.find((item) => item.id === draft.patientId)!;
    const practitioner = PRACTITIONERS.find((item) => item.id === draft.practitionerId)!;

    if (editingId) {
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === editingId
            ? {
                ...appointment,
                patientId: patient.id,
                patientName: patient.name,
                patientPhone: patient.phone,
                patientNumber: patient.patientNumber,
                practitionerId: practitioner.id,
                practitionerName: practitioner.name,
                service: draft.service,
                date: draft.date,
                schedulingType: draft.schedulingType,
                time: draft.time,
                endTime: draft.schedulingType === "window" ? draft.endTime : undefined,
                durationMinutes: draft.schedulingType === "exact" ? draft.durationMinutes : undefined,
                note: draft.note || appointment.note,
              }
            : appointment,
        ),
      );
      setToastMessage(t("agenda.toast.updated"));
    } else {
      const id = `apt-new-${nextIdRef.current}`;
      nextIdRef.current += 1;
      const created: AgendaAppointment = {
        id,
        date: draft.date,
        schedulingType: draft.schedulingType,
        time: draft.time,
        endTime: draft.schedulingType === "window" ? draft.endTime : undefined,
        durationMinutes: draft.schedulingType === "exact" ? draft.durationMinutes : undefined,
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientNumber: patient.patientNumber,
        practitionerId: practitioner.id,
        practitionerName: practitioner.name,
        service: draft.service,
        status: draft.initialStatus,
        note: draft.note || undefined,
      };
      setAppointments((current) => [...current, created]);
      setToastMessage(t("agenda.toast.created"));
    }

    setFormDialog(null);
    return { ok: true };
  }

  function handleRescheduleSubmit(draft: RescheduleDraft): RescheduleResult {
    if (!rescheduleTarget) {
      return { ok: true };
    }

    const conflictDraft = {
      practitionerId: rescheduleTarget.practitionerId,
      date: draft.date,
      schedulingType: draft.schedulingType,
      time: draft.time,
      endTime: draft.endTime,
      durationMinutes: draft.durationMinutes,
    };
    const conflict = findConflict(appointments, conflictDraft, rescheduleTarget.id);
    if (conflict) {
      return { ok: false, suggestions: suggestAlternativeTimes(appointments, conflictDraft, 3) };
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === rescheduleTarget.id
          ? {
              ...appointment,
              date: draft.date,
              schedulingType: draft.schedulingType,
              time: draft.time,
              endTime: draft.schedulingType === "window" ? draft.endTime : undefined,
              durationMinutes: draft.schedulingType === "exact" ? draft.durationMinutes : undefined,
            }
          : appointment,
      ),
    );
    setToastMessage(t("agenda.toast.rescheduled"));
    setRescheduleTarget(null);
    return { ok: true };
  }

  function handleCancelConfirm(id: string, reason: "cancelled_by_patient" | "cancelled_by_practice", note: string) {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id ? { ...appointment, status: reason, note: note || appointment.note } : appointment,
      ),
    );
    setCancelTarget(null);
    setToastMessage(t("agenda.toast.cancelled"));
  }

  function handleNoShowConfirm(id: string) {
    setAppointments((current) =>
      current.map((appointment) => (appointment.id === id ? { ...appointment, status: "no_show" as const } : appointment)),
    );
    setNoShowTarget(null);
    setToastMessage(t("agenda.toast.noShow"));
  }

  return (
    <div className="flex flex-col gap-6">
      <AgendaHeader
        dateLabel={dateLabel}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigate={handleNavigate}
        practitioners={PRACTITIONERS}
        practitionerFilter={practitionerFilter}
        onPractitionerFilterChange={setPractitionerFilter}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        onNewAppointment={() => openCreateForm()}
      />

      {activeView === "waiting" ? (
        <WaitingRoom
          appointments={todayAppointments}
          nowTime={MOCK_NOW_TIME}
          onPrimaryAction={handlePrimaryAction}
          onSelectAppointment={setSelectedAppointmentId}
        />
      ) : viewMode === "day" ? (
        dayAppointments.length === 0 ? (
          <EmptyState
            title={t("agenda.emptyTitle")}
            primaryAction={
              <Button size="sm" onClick={() => openCreateForm()}>
                {t("agenda.emptyAction")}
              </Button>
            }
          />
        ) : (
          <Card>
            <DayView
              appointments={dayAppointments}
              onSelectAppointment={setSelectedAppointmentId}
              onSelectSlot={(time) => openCreateForm({ date: selectedDate, time })}
            />
          </Card>
        )
      ) : (
        <WeekView
          weekStartIso={weekStartIso}
          appointments={weekAppointments}
          activeDayIso={selectedDate}
          onActiveDayChange={setSelectedDate}
          onSelectAppointment={setSelectedAppointmentId}
          onSelectSlot={(dateIso, time) => openCreateForm({ date: dateIso, time })}
        />
      )}

      <AppointmentDrawer
        appointment={selectedAppointment}
        open={selectedAppointmentId !== null}
        onClose={() => setSelectedAppointmentId(null)}
        onPrimaryAction={handlePrimaryAction}
        onEdit={openEditForm}
        onReschedule={setRescheduleTarget}
        onCancel={setCancelTarget}
        onNoShow={setNoShowTarget}
      />

      <AppointmentFormDialog
        key={formDialogKey}
        open={formDialog !== null}
        mode={formDialog?.mode ?? "create"}
        initialValues={formDialog?.initialValues}
        onClose={() => setFormDialog(null)}
        onSubmit={handleFormSubmit}
        patients={PATIENTS}
        practitioners={PRACTITIONERS}
        services={SERVICES}
      />

      <RescheduleDialog
        open={rescheduleTarget !== null}
        appointment={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onSubmit={handleRescheduleSubmit}
      />

      <CancelConfirmDialog
        open={cancelTarget !== null}
        appointment={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
      />

      <NoShowConfirmDialog
        open={noShowTarget !== null}
        appointment={noShowTarget}
        onClose={() => setNoShowTarget(null)}
        onConfirm={handleNoShowConfirm}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
