"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMad } from "@/features/finance/format";
import type { CashMovement } from "@/components/domain/finance/types";

export interface CaisseMovementListProps {
  movements: CashMovement[];
}

/**
 * Read-only movement history (UI-006C §23/§27/§29/§34) — newest first
 * (already sorted by `buildCashMovements`), no edit/delete, no manual
 * "+ Mouvement" creation anywhere. A patient-payment row navigates to the
 * existing `/app/patients/{patientId}/payments` surface (§28) — never a
 * duplicate payment detail/capture here. Direction is never color/sign
 * alone (§51): every row pairs the textual "Encaissement"/"Décaissement"
 * type label (reusing the Finance dashboard's own `finance.activity.*`
 * keys — the same concept, not a new translation) with the amount.
 */
export function CaisseMovementList({ movements }: CaisseMovementListProps) {
  const { t, locale } = useLocale();

  if (movements.length === 0) {
    return <EmptyState title={t("finance.caisse.movements.emptyTitle")} />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {movements.map((movement) => {
        const isNavigable = movement.type === "patient_payment" && Boolean(movement.patientId);
        const card = (
          <Card
            className={
              isNavigable
                ? "flex flex-wrap items-center justify-between gap-3 transition-colors hover:bg-surface-subtle"
                : "flex flex-wrap items-center justify-between gap-3"
            }
          >
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {t(movement.type === "patient_payment" ? "finance.activity.payment" : "finance.activity.expense")}
              </p>
              <p className="truncate text-sm font-medium text-text">{movement.label}</p>
              <p className="text-xs text-text-muted" dir="ltr">
                {movement.occurredAt}
                {movement.reference && <> · {movement.reference}</>}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-text" dir="ltr">
              {movement.direction === "in" ? "+" : "−"}
              {formatMad(movement.amount, locale)}
            </span>
          </Card>
        );

        return (
          <li key={movement.id}>
            {isNavigable ? (
              <Link
                href={`/app/patients/${movement.patientId}/payments`}
                aria-label={t("finance.caisse.movements.viewPaymentAriaLabel", { patientName: movement.label })}
                className="block"
              >
                {card}
              </Link>
            ) : (
              card
            )}
          </li>
        );
      })}
    </ul>
  );
}
