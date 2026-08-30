"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  helperText?: string;
  error?: string;
  /** Accessible label for the toggle button in its "show" state. */
  showLabel: string;
  /** Accessible label for the toggle button in its "hide" state. */
  hideLabel: string;
}

/**
 * Password field with an accessible show/hide toggle (Spec #9 Screen 01's
 * own 👁 icon) — no existing password-visibility pattern exists anywhere
 * in this codebase (grep-confirmed), so this mirrors `Input`'s exact
 * label/error/describedby structure and visual classes rather than
 * inventing a different look. The toggle only changes the local `type`
 * attribute — never logs, stores, or otherwise surfaces the value itself
 * (task §6: "Do not expose password in logs/state diagnostics").
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, helperText, error, required, disabled, id, showLabel, hideLabel, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
            {required && (
              <span className="text-danger" aria-hidden="true">
                {" "}
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            required={required}
            disabled={disabled}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-10 w-full rounded-md border bg-surface ps-3 pe-10 text-sm text-text",
              "placeholder:text-text-muted",
              "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted",
              error ? "border-danger" : "border-border-strong",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? hideLabel : showLabel}
            aria-pressed={visible}
            disabled={disabled}
            className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-text-muted hover:text-text disabled:cursor-not-allowed"
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>

        {error ? (
          <p id={errorId} className="text-sm text-danger">
            {error}
          </p>
        ) : (
          helperText && (
            <p id={helperId} className="text-sm text-text-muted">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
