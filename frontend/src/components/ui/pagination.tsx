import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
}

/** Compact prev/next pagination (Spec #8 §58) — no numbered page list, no "show all". */
export function Pagination({ page, pageCount, onPageChange, previousLabel, nextLabel, pageLabel }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={pageLabel} className="flex items-center justify-between gap-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {previousLabel}
      </Button>
      <span className="text-sm text-text-muted" aria-live="polite">
        {pageLabel}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </Button>
    </nav>
  );
}
