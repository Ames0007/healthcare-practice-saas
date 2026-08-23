import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, helperText, error, required, disabled, id, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
            {required && (
              <span className="text-danger" aria-hidden="true">
                {" "}
                *
              </span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 rounded-md border bg-surface px-3 text-sm text-text",
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

Input.displayName = "Input";
