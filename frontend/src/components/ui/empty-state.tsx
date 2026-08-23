import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}

/**
 * Reusable empty state (Spec #8 §56): short title, explanation, one
 * primary next action, optional secondary action.
 */
export function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {(primaryAction || secondaryAction) && (
        <div className="mt-2 flex items-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
