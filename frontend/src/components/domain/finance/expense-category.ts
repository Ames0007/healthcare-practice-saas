import { Droplet, HandCoins, Package, Wrench, type LucideIcon } from "lucide-react";
import type { ExpenseCategory } from "./types";

interface ExpenseCategoryMeta {
  translationKey: string;
  icon: LucideIcon;
}

/** Central expense category → label/icon registry (UI-006A §11), mirroring `invoice-status.ts`/`payment-status.ts`'s pattern. */
export const EXPENSE_CATEGORY_MAP: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  supplies: { translationKey: "finance.expenseCategory.supplies", icon: Package },
  utilities: { translationKey: "finance.expenseCategory.utilities", icon: Droplet },
  services: { translationKey: "finance.expenseCategory.services", icon: Wrench },
  other: { translationKey: "finance.expenseCategory.other", icon: HandCoins },
};
