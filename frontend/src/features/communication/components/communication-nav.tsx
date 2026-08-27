"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { Tabs, type TabItem } from "@/components/ui/tabs";

type CommunicationSectionKey = "overview" | "messages" | "templates" | "automations";

/** Exact/path-aware matching (mirrors `StockNav`): `/app/communication` itself must only be active for the literal overview route. */
function resolveActiveSection(pathname: string): CommunicationSectionKey {
  if (pathname.startsWith("/app/communication/messages")) return "messages";
  if (pathname.startsWith("/app/communication/templates")) return "templates";
  if (pathname.startsWith("/app/communication/automations")) return "automations";
  return "overview";
}

/**
 * Shared Communication workspace section navigation (UI-009ABC §7) — Vue
 * d'ensemble/Messages/Modèles/Automatisations, all four routes now shipped
 * (Gate 3 completes the set, mirrors `StockNav`'s own history of growing
 * one tab per gate).
 */
export function CommunicationNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const activeKey = resolveActiveSection(pathname);

  const items: TabItem[] = [
    { key: "overview", label: t("communication.nav.overview"), href: "/app/communication" },
    { key: "messages", label: t("communication.nav.messages"), href: "/app/communication/messages" },
    { key: "templates", label: t("communication.nav.templates"), href: "/app/communication/templates" },
    { key: "automations", label: t("communication.nav.automations"), href: "/app/communication/automations" },
  ];

  return <Tabs ariaLabel={t("communication.nav.navigationLabel")} activeKey={activeKey} items={items} />;
}
