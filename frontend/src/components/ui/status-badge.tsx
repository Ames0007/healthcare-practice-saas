import {
  CheckCircle2,
  CircleDashed,
  Info,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Centralized semantic tones (Spec #8 §7-9, §46). Domain-specific status
 * registries (appointment status, invoice status, ...) map their statuses
 * onto one of these tones rather than choosing colors themselves.
 */
export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}

const toneConfig: Record<StatusTone, { classes: string; icon: LucideIcon }> = {
  success: {
    classes: "bg-success-subtle text-success",
    icon: CheckCircle2,
  },
  warning: {
    classes: "bg-warning-subtle text-warning",
    icon: TriangleAlert,
  },
  danger: {
    classes: "bg-danger-subtle text-danger",
    icon: XCircle,
  },
  info: {
    classes: "bg-info-subtle text-info",
    icon: Info,
  },
  neutral: {
    classes: "bg-surface-subtle text-text-secondary",
    icon: CircleDashed,
  },
};

/**
 * Status is never communicated by color alone: every tone pairs a distinct
 * icon shape with the color (Spec #7 §7 / #8 §7).
 */
export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  const { classes, icon: Icon } = toneConfig[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        classes,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {children}
    </span>
  );
}
