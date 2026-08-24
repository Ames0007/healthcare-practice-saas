"use client";

import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";
import { SESSION_STATUS_CELL_CLASSES, SESSION_STATUS_MAP } from "./session-status";
import type { TreatmentSession } from "./types";

export interface SessionTrackerProps {
  sessions: TreatmentSession[];
  onSelect: (sessionId: string) => void;
}

/**
 * Compact accessible session grid (Spec #9 Screen 22, UI-004C §19):
 * sequence number + a status icon, never color alone — each cell carries
 * its own accessible name ("Séance 13 — Planifiée") and is a real button
 * opening that session's detail.
 */
export function SessionTracker({ sessions, onSelect }: SessionTrackerProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-5 gap-2">
      {sessions.map((session) => {
        const meta = SESSION_STATUS_MAP[session.status];
        const Icon = meta.icon;
        const statusLabel = t(meta.translationKey);

        return (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            aria-label={t("patientDetail.treatments.sessionCellLabel", { n: session.sequenceNumber, status: statusLabel })}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-xs font-semibold transition-opacity hover:opacity-80",
              SESSION_STATUS_CELL_CLASSES[meta.tone],
            )}
          >
            <span aria-hidden="true">{session.sequenceNumber}</span>
            <Icon className="h-3 w-3" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
