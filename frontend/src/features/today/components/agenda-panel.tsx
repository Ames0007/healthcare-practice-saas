"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { AppointmentCard } from "@/components/domain/appointments/appointment-card";
import type { TodayAppointment } from "@/features/today/types";

export function AgendaPanel({ agenda }: { agenda: TodayAppointment[] }) {
  const { t } = useLocale();

  return (
    <Card className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t("aujourdhui.agenda.title")}
      </h2>
      <div className="flex flex-col">
        {agenda.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            variant="row"
            time={appointment.time}
            endTime={appointment.endTime}
            patientName={appointment.patientName}
            service={appointment.service}
            status={appointment.status}
          />
        ))}
      </div>
      <Link
        href="/app/agenda"
        className="mt-2 inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary hover:text-primary-hover"
      >
        {t("aujourdhui.agenda.viewAll")}
        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </Link>
    </Card>
  );
}
