import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type MetricCardEmphasis = "neutral" | "primary" | "warning" | "danger" | "success";

export interface MetricCardProps {
  label: string;
  value: string | number;
  supportingText?: string;
  icon?: LucideIcon;
  emphasis?: MetricCardEmphasis;
  className?: string;
}

const emphasisText: Record<MetricCardEmphasis, string> = {
  neutral: "text-text",
  primary: "text-primary",
  warning: "text-warning",
  danger: "text-danger",
  success: "text-success",
};

/**
 * Generic operational metric card (Spec #8 §43): label + value, optional
 * supporting text/icon. Emphasis is carried by typography color only —
 * never a giant colored block or icon (Spec #10 §14/§18/§22). Domain-
 * neutral by design so Aujourd'hui, Finance and future screens can all
 * compose it.
 */
export function MetricCard({
  label,
  value,
  supportingText,
  icon: Icon,
  emphasis = "neutral",
  className,
}: MetricCardProps) {
  return (
    <Card variant="metric" className={className}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />}
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", emphasisText[emphasis])}>
        {value}
      </p>
      {supportingText && <p className="mt-1 text-xs text-text-muted">{supportingText}</p>}
    </Card>
  );
}
