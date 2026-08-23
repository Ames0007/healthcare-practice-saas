import {
  Activity,
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
 *
 * `primary` is the restrained-teal "active process" tone (Spec #10 §6, e.g.
 * appointment "In consultation") — distinct from `info`.
 */
export type StatusTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const toneConfig: Record<StatusTone, { classes: string; icon: LucideIcon }> = {
  primary: {
    classes: "bg-primary-soft text-primary",
    icon: Activity,
  },
  success: {
    classes: "bg-success-soft text-success",
    icon: CheckCircle2,
  },
  warning: {
    classes: "bg-warning-soft text-warning",
    icon: TriangleAlert,
  },
  danger: {
    classes: "bg-danger-soft text-danger",
    icon: XCircle,
  },
  info: {
    classes: "bg-info-soft text-info",
    icon: Info,
  },
  neutral: {
    classes: "bg-surface-subtle text-text-secondary",
    icon: CircleDashed,
  },
};

export interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}

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
