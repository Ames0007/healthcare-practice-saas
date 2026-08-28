import type { PaymentMethodRow } from "@/components/domain/settings/types";

/**
 * Payment methods this prototype actually supports (UI-010BC Gate 2) — one
 * row, reusing Finance's own `PaymentMethod` literal type verbatim
 * (currently exactly `"cash"`, see `PaymentMethodRow`'s own doc comment).
 * Not a fixture to "load" from elsewhere since there is nothing to
 * aggregate — this is a direct, honest reflection of the type itself.
 */
export function getPaymentMethodRows(): PaymentMethodRow[] {
  return [{ method: "cash", labelKey: "parametres.paiements.method.cash", active: true }];
}
