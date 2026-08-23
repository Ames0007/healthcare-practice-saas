import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-colors duration-150 disabled:cursor-not-allowed " +
  "disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary:
    "bg-surface-subtle text-text border border-border hover:bg-border/40",
  outline:
    "border border-border-strong text-text bg-transparent hover:bg-surface-subtle",
  ghost: "text-text bg-transparent hover:bg-surface-subtle",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "h-10 w-10",
};

/**
 * Exposes the same visual classes for non-`<button>` elements that must
 * look like a button (e.g. a `next/link` navigation styled as a primary
 * action) without nesting interactive elements inside a `<button>`.
 */
export function buttonClassNames(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
