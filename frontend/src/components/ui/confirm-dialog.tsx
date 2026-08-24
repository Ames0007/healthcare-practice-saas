"use client";

import type { ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  /** Extra fields between the description and the action row (e.g. cancellation reason). */
  children?: ReactNode;
  confirmDisabled?: boolean;
}

/**
 * Sensitive-action confirmation (Spec #8 §51): title, consequence
 * explanation, optional extra fields, explicit Cancel + confirm actions.
 * Wraps the shared `Dialog` primitive in its "alert" variant.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  cancelLabel,
  confirmLabel,
  tone = "primary",
  children,
  confirmDisabled,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} variant="alert" label={title} size="sm">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        {description && <div className="text-sm text-text-secondary">{description}</div>}
        {children}
        <div className="mt-2 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
