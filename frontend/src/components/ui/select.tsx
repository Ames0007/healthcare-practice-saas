import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

/** Mirrors `Input`'s label/error/describedby pattern for `<select>` fields. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, required, disabled, id, options, placeholder, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">
            {label}
            {required && (
              <span className="text-danger" aria-hidden="true">
                {" "}
                *
              </span>
            )}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 rounded-md border bg-surface px-3 text-sm text-text",
            "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted",
            error ? "border-danger" : "border-border-strong",
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

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

Select.displayName = "Select";
