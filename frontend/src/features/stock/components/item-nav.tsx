"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Tabs, type TabItem } from "@/components/ui/tabs";

export type ItemTabKey = "overview" | "lots" | "movements";

const TAB_PATH_SUFFIX: Record<ItemTabKey, string> = {
  overview: "",
  lots: "/lots",
  movements: "/movements",
};

export interface ItemNavProps {
  itemId: string;
  activeTab: ItemTabKey;
  /** Only shown once the item is lot-tracked (Gate 2) — a non-lot-tracked item has no lots to view. */
  showLots?: boolean;
}

/**
 * Item 360° internal navigation — Aperçu/Lots/Mouvements, mirrors
 * `TeamMemberNav`'s own per-id `href`-based `Tabs` usage (real routes, not
 * `usePathname` prefix matching, since this nav is nested under a
 * per-item `[id]`).
 */
export function ItemNav({ itemId, activeTab, showLots = false }: ItemNavProps) {
  const { t } = useLocale();

  const tabs: ItemTabKey[] = showLots ? ["overview", "lots", "movements"] : ["overview", "movements"];
  const items: TabItem[] = tabs.map((tab) => ({
    key: tab,
    label: t(`stock.itemDetail.tabs.${tab}`),
    href: `/app/stock/items/${itemId}${TAB_PATH_SUFFIX[tab]}`,
  }));

  return <Tabs ariaLabel={t("stock.itemDetail.tabs.navigationLabel")} activeKey={activeTab} items={items} />;
}
