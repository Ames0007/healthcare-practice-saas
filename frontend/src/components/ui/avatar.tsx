import { cn } from "@/lib/cn";

export interface AvatarProps {
  /** Short initials fallback (Spec #8 §47) — photos are not required/supported yet. */
  initials: string;
  className?: string;
}

export function Avatar({ initials, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary",
        className,
      )}
    >
      {initials}
    </span>
  );
}
