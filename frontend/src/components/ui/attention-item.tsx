import type { LucideIcon } from "lucide-react";
import type { StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";

export interface AttentionItemProps {
  icon: LucideIcon;
  label: string;
  count: number;
  tone?: StatusTone;
}

const toneText: Record<StatusTone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  neutral: "text-text-muted",
};

/**
 * Generic actionable-count row (Spec #8 §97 "Alert"/action-list item) —
 * domain-neutral so it can be reused by future notification/alert panels,
 * not just Aujourd'hui's "À faire" list.
 */
export function AttentionItem({ icon: Icon, label, count, tone = "neutral" }: AttentionItemProps) {
  return (
    <li className="flex items-center gap-3 py-2">
      <Icon className={cn("h-4 w-4 shrink-0", toneText[tone])} aria-hidden="true" />
      <span className="flex-1 text-sm text-text">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", toneText[tone])}>{count}</span>
    </li>
  );
}
