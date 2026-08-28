"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { AppointmentCard } from "@/components/domain/appointments/appointment-card";
import { Button, buttonClassNames } from "@/components/ui/button";
import type { TodayAppointment } from "@/features/today/types";

/**
 * "Ouvrir" navigates to Agenda rather than a specific appointment (UI-FIX):
 * `TodayAppointment.id` is its own reduced fixture id, not a real Agenda
 * appointment id (Aujourd'hui "only ever assigns 6 of its 11 members to
 * mock data" — its own doc comment) — deep-linking to a specific Agenda
 * item here would be an unreliable guessed join, not a real derivation.
 */
export function NextAppointmentSection({
  appointment,
  onMarkArrived,
}: {
  appointment: TodayAppointment;
  onMarkArrived: (id: string) => void;
}) {
  const { t } = useLocale();
  const canMarkArrived = appointment.status === "confirmed" || appointment.status === "to_confirm";

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t("aujourdhui.nextAppointment.title")}
      </h2>
      <AppointmentCard
        variant="prominent"
        time={appointment.time}
        endTime={appointment.endTime}
        patientName={appointment.patientName}
        service={appointment.service}
        status={appointment.status}
        practitioner={appointment.practitioner}
        actions={
          <>
            <Link href="/app/agenda" className={buttonClassNames("outline", "sm")}>
              {t("aujourdhui.nextAppointment.open")}
            </Link>
            {canMarkArrived && (
              <Button size="sm" onClick={() => onMarkArrived(appointment.id)}>
                {t("aujourdhui.nextAppointment.markArrived")}
              </Button>
            )}
          </>
        }
      />
    </section>
  );
}
