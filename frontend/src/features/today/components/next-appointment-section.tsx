"use client";

import { useLocale } from "@/i18n/locale-provider";
import { AppointmentCard } from "@/components/domain/appointments/appointment-card";
import { Button } from "@/components/ui/button";
import type { TodayAppointment } from "@/features/today/types";

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
            <Button variant="outline" size="sm">
              {t("aujourdhui.nextAppointment.open")}
            </Button>
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
