"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { Tabs, type TabItem } from "@/components/ui/tabs";

type StockSectionKey = "overview" | "items" | "movements" | "lots";

/** Exact/path-aware matching (mirrors `FinanceNav`): `/app/stock` itself must only be active for the literal overview route. */
function resolveActiveSection(pathname: string): StockSectionKey {
  if (pathname.startsWith("/app/stock/items")) return "items";
  if (pathname.startsWith("/app/stock/movements")) return "movements";
  if (pathname.startsWith("/app/stock/lots")) return "lots";
  return "overview";
}

/**
 * Shared Stock workspace section navigation (UI-008ABCD §9) — Vue
 * d'ensemble/Articles/Mouvements/Lots & expirations. Mirrors `FinanceNav`
 * exactly: real `<Link>`s via the existing `Tabs` primitive, `usePathname`
 * prefix matching (non-parameterized routes), not a new sidebar entry —
 * Stock stays one sidebar module, this is its own internal section nav.
 */
export function StockNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const activeKey = resolveActiveSection(pathname);

  const items: TabItem[] = [
    { key: "overview", label: t("stock.nav.overview"), href: "/app/stock" },
    { key: "items", label: t("stock.nav.items"), href: "/app/stock/items" },
    { key: "movements", label: t("stock.nav.movements"), href: "/app/stock/movements" },
    { key: "lots", label: t("stock.nav.lots"), href: "/app/stock/lots" },
  ];

  return <Tabs ariaLabel={t("stock.nav.navigationLabel")} activeKey={activeKey} items={items} />;
}
