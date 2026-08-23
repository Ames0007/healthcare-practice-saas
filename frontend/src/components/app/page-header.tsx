import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}

/**
 * Reusable page header (Spec #8 §78). No breadcrumbs — sidebar + title
 * already provide orientation.
 */
export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryAction,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-text">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        )}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3">
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
