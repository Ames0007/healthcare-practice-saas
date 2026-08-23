import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "standard" | "metric" | "alert" | "compact";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const paddingByVariant: Record<CardVariant, string> = {
  standard: "p-5",
  metric: "p-5",
  alert: "p-4",
  compact: "p-3",
};

/**
 * Restrained base card (Spec #8 §42): surface + border + radius, no heavy
 * shadow. Feature code should compose this rather than build ad hoc
 * bordered divs.
 */
export function Card({ className, variant = "standard", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface",
        paddingByVariant[variant],
        variant === "alert" && "border-warning bg-warning-subtle",
        className,
      )}
      {...props}
    />
  );
}
