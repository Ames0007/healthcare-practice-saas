import {
  Boxes,
  HeartPulse,
  Package,
  Pill,
  Scissors,
  Shield,
  Siren,
  SprayCan,
  Syringe,
  TestTube,
  type LucideIcon,
} from "lucide-react";
import type { InventoryCategory } from "./types";

interface InventoryCategoryMeta {
  translationKey: string;
  icon: LucideIcon;
}

/** Central inventory category → label/icon registry (UI-008ABCD §10), mirroring `expense-category.ts`'s pattern. */
export const INVENTORY_CATEGORY_MAP: Record<InventoryCategory, InventoryCategoryMeta> = {
  medical_consumables: { translationKey: "stock.category.medical_consumables", icon: Package },
  medicines: { translationKey: "stock.category.medicines", icon: Pill },
  procedure_products: { translationKey: "stock.category.procedure_products", icon: Syringe },
  diagnostic_consumables: { translationKey: "stock.category.diagnostic_consumables", icon: TestTube },
  sterilization_infection_control: { translationKey: "stock.category.sterilization_infection_control", icon: SprayCan },
  ppe: { translationKey: "stock.category.ppe", icon: Shield },
  disposable_medical_devices: { translationKey: "stock.category.disposable_medical_devices", icon: Scissors },
  patient_aftercare: { translationKey: "stock.category.patient_aftercare", icon: HeartPulse },
  emergency_stock: { translationKey: "stock.category.emergency_stock", icon: Siren },
  operational_stock: { translationKey: "stock.category.operational_stock", icon: Boxes },
};

/** Deterministic iteration order for filters/forms — Select options never rely on object key order. */
export const INVENTORY_CATEGORY_ORDER: InventoryCategory[] = [
  "medical_consumables",
  "medicines",
  "procedure_products",
  "diagnostic_consumables",
  "sterilization_infection_control",
  "ppe",
  "disposable_medical_devices",
  "patient_aftercare",
  "emergency_stock",
  "operational_stock",
];
