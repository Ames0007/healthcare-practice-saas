import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Shape-matched loading placeholder (Spec #8 §57). Compose with explicit
 * width/height classes at the call site to match the final layout — avoid
 * a generic centered spinner for ordinary page loads.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-surface-subtle",
        className,
      )}
      {...props}
    />
  );
}
