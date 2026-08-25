"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidOpeningBalance } from "@/features/caisse/calculations";

export interface ClosedCaissePanelProps {
  defaultOpeningBalance: number;
  onOpen: (openingBalance: number) => void;
}

/**
 * FERMÉE state (UI-006C §18): opening-balance input + "Ouvrir la caisse"
 * (Spec #9 Screen 30's closed-state wireframe). Whole-MAD, non-negative
 * validation only (§19) — reuses the exact `Input`/error pattern already
 * established by the payment-capture form (UI-004E), including its own
 * "Montant invalide." message rather than inventing a new one.
 */
export function ClosedCaissePanel({ defaultOpeningBalance, onOpen }: ClosedCaissePanelProps) {
  const { t } = useLocale();
  const [openingBalance, setOpeningBalance] = useState(String(defaultOpeningBalance));
  const [error, setError] = useState<string | undefined>(undefined);

  function handleOpen() {
    const value = Number(openingBalance);
    if (!isValidOpeningBalance(value)) {
      setError(t("patientDetail.payments.form.invalidAmountError"));
      return;
    }
    setError(undefined);
    onOpen(value);
  }

  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">{t("finance.caisse.closedDescription")}</p>

      <Input
        label={t("finance.caisse.openingBalanceLabel")}
        required
        inputMode="numeric"
        dir="ltr"
        value={openingBalance}
        onChange={(event) => setOpeningBalance(event.target.value)}
        error={error}
      />

      <Button type="button" onClick={handleOpen} className="w-fit">
        {t("finance.caisse.openAction")}
      </Button>
    </Card>
  );
}
