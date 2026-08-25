import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

/** Mirrors `Input`'s label/error/describedby pattern (Spec #8 §29) — plain textarea, no rich-text editor. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, required, disabled, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const helperId = `${textareaId}-helper`;
    const errorId = `${textareaId}-error`;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-secondary">
            {label}
            {required && (
              <span className="text-danger" aria-hidden="true">
                {" "}
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-24 resize-y rounded-md border bg-surface px-3 py-2 text-sm text-text",
            "placeholder:text-text-muted",
            "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted",
            error ? "border-danger" : "border-border-strong",
            className,
          )}
          {...props}
        />

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

Textarea.displayName = "Textarea";
