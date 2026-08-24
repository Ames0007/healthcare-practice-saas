"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** "drawer" slides from the inline-end edge; "modal"/"alert" center. */
  variant: "drawer" | "modal" | "alert";
  /** Accessible name — the caller renders its own matching visible heading. */
  label: string;
  /** Visible close-button label (e.g. translated "Fermer"). Omit to hide the button (caller supplies its own explicit actions, e.g. ConfirmDialog). */
  closeLabel?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

/**
 * Generic accessible dialog primitive (Spec #8 §49-51): focus trapped
 * while open, initial focus moved into the panel, Escape closes, focus
 * returns to the trigger on close. Backs both `AppointmentDrawer` and the
 * appointment create/edit/reschedule/cancel/no-show dialogs (UI-002) —
 * one focus-trap implementation, not one per surface.
 */
export function Dialog({ open, onClose, variant, label, closeLabel, size = "md", children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? panel)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) {
        return;
      }

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) {
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-text/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role={variant === "alert" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-full flex-col bg-surface shadow-ds-lg outline-none",
          variant === "drawer" && "ms-auto h-full w-full max-w-md border-s border-border sm:max-w-[26rem]",
          variant !== "drawer" && "m-auto w-full rounded-lg border border-border",
          variant !== "drawer" && size === "sm" && "max-w-sm",
          variant !== "drawer" && size === "md" && "max-w-lg",
          variant !== "drawer" && size === "lg" && "max-w-2xl",
        )}
      >
        {closeLabel && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute end-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-subtle hover:text-text"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <div className={cn("flex-1 overflow-y-auto p-6", closeLabel && "pt-12")}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
