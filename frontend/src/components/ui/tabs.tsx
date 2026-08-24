import Link from "next/link";
import { cn } from "@/lib/cn";

export interface TabItem {
  key: string;
  label: string;
  href: string;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  ariaLabel: string;
}

/**
 * Real-navigation tabs (Spec #8 §48): each tab is a genuine URL, so this
 * uses `<nav>` + `aria-current="page"` rather than the ARIA `tablist`
 * pattern (which is for JS-only panel switching with no URL change — see
 * Agenda's Day/Week toggle, UI-002, for that case instead). Horizontally
 * scrollable so six tabs stay usable on mobile without wrapping.
 */
export function Tabs({ items, activeKey, ariaLabel }: TabsProps) {
  return (
    <nav aria-label={ariaLabel} className="flex gap-1 overflow-x-auto border-b border-border">
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
