"use client";

import Link from "next/link";
import { CalendarPlus, MessageSquarePlus, PackagePlus, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";

interface QuickCreateAction {
  key: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  descriptionKey: string;
}

const QUICK_CREATE_ACTIONS: QuickCreateAction[] = [
  { key: "appointment", href: "/app/agenda", icon: CalendarPlus, labelKey: "topbar.quickCreateMenu.appointment.label", descriptionKey: "topbar.quickCreateMenu.appointment.description" },
  { key: "patient", href: "/app/patients", icon: UserPlus, labelKey: "topbar.quickCreateMenu.patient.label", descriptionKey: "topbar.quickCreateMenu.patient.description" },
  { key: "stockMovement", href: "/app/stock/movements", icon: PackagePlus, labelKey: "topbar.quickCreateMenu.stockMovement.label", descriptionKey: "topbar.quickCreateMenu.stockMovement.description" },
  { key: "message", href: "/app/communication", icon: MessageSquarePlus, labelKey: "topbar.quickCreateMenu.message.label", descriptionKey: "topbar.quickCreateMenu.message.description" },
  { key: "expense", href: "/app/finance/expenses", icon: Wallet, labelKey: "topbar.quickCreateMenu.expense.label", descriptionKey: "topbar.quickCreateMenu.expense.description" },
];

export interface QuickCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Global Quick Create launcher (Spec #2 §4.3, Spec #7 §5, Spec #8 §77's
 * `QuickCreate`) — a pure navigation menu into each action's own already-
 * built creation workflow, never a duplicate form (task's own explicit
 * "must NOT create another copy of PatientForm/AppointmentForm/...").
 * "Nouvelle facture"/"Nouvel encaissement" are deliberately omitted: no
 * manual invoice-creation workflow exists anywhere (`GlobalInvoicesPage`'s
 * own doc comment: "no invoice creation... anywhere on this screen" —
 * invoices only ever originate from an appointment/treatment/session,
 * CLAUDE.md §21) and payment capture is hard-scoped to a specific
 * patient+invoice (`PatientPaymentCaptureDialog`, reachable only from
 * Patient 360° → Paiements) with no safe cabinet-wide patient-selection
 * entry point to deep-link into — inventing one would be new plumbing
 * beyond this audit's "wire existing controls" scope (task §6).
 */
export function QuickCreateDialog({ open, onClose }: QuickCreateDialogProps) {
  const { t } = useLocale();

  return (
    <Dialog open={open} onClose={onClose} variant="modal" size="sm" label={t("topbar.quickCreateMenu.navigationLabel")} closeLabel={t("agenda.drawer.close")}>
      <h2 className="text-lg font-semibold text-text">{t("topbar.quickCreateMenu.title")}</h2>
      <ul className="mt-4 flex flex-col gap-1">
        {QUICK_CREATE_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.key}>
              <Link
                href={action.href}
                onClick={onClose}
                className="flex items-start gap-3 rounded-md p-3 text-start hover:bg-surface-subtle"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-text">{t(action.labelKey)}</span>
                  <span className="text-xs text-text-muted">{t(action.descriptionKey)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
