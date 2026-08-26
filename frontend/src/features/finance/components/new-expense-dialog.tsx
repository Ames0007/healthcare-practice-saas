"use client";

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EXPENSE_CATEGORY_MAP } from "@/components/domain/finance/expense-category";
import { ALLOWED_SUPPORTING_MIME_TYPES, EXPENSE_CATEGORY_ORDER, isValidExpenseAmount, type NewExpenseInput } from "@/features/finance/expenses";
import type { ExpenseCategory } from "@/components/domain/finance/types";

export interface NewExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewExpenseInput) => void;
}

interface SelectedFileMeta {
  name: string;
  type: string;
  size: number;
}

/**
 * "+ Nouveau décaissement" form (UI-006D §19-28, Spec #9 Screen 32) —
 * category, amount, description and an optional supporting document only;
 * deliberately no beneficiary/payment-method fields (the task's own field
 * list at §19 omits them, and every décaissement created here is
 * implicitly a cash expense — `CabinetExpense` has no payment-method field
 * to begin with, UI-006A). Only reachable while Caisse is open — the
 * parent page never mounts this with `open` while closed (§18).
 */
export function NewExpenseDialog({ open, onClose, onSubmit }: NewExpenseDialogProps) {
  const { t } = useLocale();
  const fileInputId = useId();
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fileMeta, setFileMeta] = useState<SelectedFileMeta | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileMeta(file ? { name: file.name, type: file.type, size: file.size } : null);
  }

  function validate(amountValue: number): Record<string, string> {
    const required = t("patients.form.requiredError");
    const nextErrors: Record<string, string> = {};

    if (!category) nextErrors.category = required;
    if (!amount.trim()) {
      nextErrors.amount = required;
    } else if (!isValidExpenseAmount(amountValue)) {
      nextErrors.amount = t("patientDetail.payments.form.invalidAmountError");
    }
    if (!description.trim()) nextErrors.description = required;
    if (fileMeta && !ALLOWED_SUPPORTING_MIME_TYPES.includes(fileMeta.type)) {
      nextErrors.file = t("patientDetail.health.documents.form.fileTypeError");
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const amountValue = Number(amount);
    const nextErrors = validate(amountValue);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !category) {
      return;
    }

    onSubmit({
      category,
      amount: amountValue,
      description: description.trim(),
      supportingDocument: fileMeta ? { fileName: fileMeta.name, mimeType: fileMeta.type, sizeBytes: fileMeta.size } : undefined,
    });
  }

  const title = t("finance.expenses.form.title");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("agenda.drawer.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{title}</h2>

        <Select
          label={t("finance.expenses.form.categoryLabel")}
          required
          value={category}
          onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
          options={EXPENSE_CATEGORY_ORDER.map((value) => ({ value, label: t(EXPENSE_CATEGORY_MAP[value].translationKey) }))}
          placeholder={t("finance.expenses.form.categoryPlaceholder")}
          error={errors.category}
        />

        <Input
          label={t("finance.expenses.form.amountLabel")}
          required
          inputMode="numeric"
          dir="ltr"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={errors.amount}
        />

        <Input
          label={t("finance.expenses.form.descriptionLabel")}
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor={fileInputId} className="text-sm font-medium text-text-secondary">
            {t("finance.expenses.form.fileLabel")}
          </label>
          <input
            id={fileInputId}
            type="file"
            accept={ALLOWED_SUPPORTING_MIME_TYPES.join(",")}
            onChange={handleFileChange}
            aria-invalid={!!errors.file || undefined}
            className="text-sm text-text file:me-3 file:rounded-md file:border file:border-border-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text hover:file:bg-surface-subtle"
          />
          {errors.file && <p className="text-sm text-danger">{errors.file}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("finance.expenses.form.cancel")}
          </Button>
          <Button type="submit">{t("finance.expenses.form.submit")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
