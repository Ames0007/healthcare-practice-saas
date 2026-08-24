import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export interface PatientSummaryCardProps {
  label: string;
  value: string;
  secondary?: string;
  /** Restrained empty-state rendering (UI-004A §27/§28) — never a big bold number for "nothing here". */
  isEmpty?: boolean;
  /** Set to "ltr" when `value` is a formatted date/time/money string, so it isolates correctly inside RTL layout (UI-004A §13/§39). */
  valueDir?: "ltr";
}

/**
 * One Patient 360° overview card (Spec #9 Screen 17, UI-004A §25). Not
 * `MetricCard` — that component's bold 2xl-number treatment doesn't fit an
 * empty-state sentence like "Aucun traitement actif" gracefully.
 */
export function PatientSummaryCard({ label, value, secondary, isEmpty, valueDir }: PatientSummaryCardProps) {
  return (
    <Card variant="metric">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p
        dir={!isEmpty ? valueDir : undefined}
        className={cn("mt-2", isEmpty ? "text-sm font-normal text-text-muted" : "text-lg font-semibold text-text")}
      >
        {value}
      </p>
      {secondary && <p className="mt-1 text-sm text-text-secondary">{secondary}</p>}
    </Card>
  );
}
