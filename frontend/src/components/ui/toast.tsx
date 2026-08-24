"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

/**
 * Minimal transient success feedback (Spec #8 §54: "Toast ... transient
 * acknowledgement"). Deliberately not a global provider/queue — a single
 * message slot is all the prototype's feature pages need (Spec #6 §46:
 * avoid installing a full notification library for this).
 */
export function Toast({ message, onDismiss, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, durationMs]);

  if (!message) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:justify-end sm:pe-4">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text shadow-ds-md"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
        {message}
      </div>
    </div>
  );
}
