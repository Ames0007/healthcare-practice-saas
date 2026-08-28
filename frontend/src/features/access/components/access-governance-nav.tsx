"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { Tabs, type TabItem } from "@/components/ui/tabs";

type AccessSectionKey = "users" | "roles" | "permissions" | "delegations" | "historique";

/** Exact/path-aware matching (mirrors `SubscriptionNav`/`ParametresNav`): `/app/parametres/access` itself must only be active for the literal Utilisateurs route. */
function resolveActiveSection(pathname: string): AccessSectionKey {
  if (pathname.startsWith("/app/parametres/access/roles")) return "roles";
  if (pathname.startsWith("/app/parametres/access/permissions")) return "permissions";
  if (pathname.startsWith("/app/parametres/access/delegations")) return "delegations";
  if (pathname.startsWith("/app/parametres/access/historique")) return "historique";
  return "users";
}

/**
 * Internal Accès & permissions navigation (UI-011X, task §5) — nested one
 * level deeper than `ParametresNav` (which shows "Accès & permissions" as
 * its own 8th tab; both navs render together on every `/app/parametres/
 * access*` route, mirroring `TeamMemberDetailPage`'s own stacked-nav
 * shape). Task's own order: Utilisateurs / Rôles / Permissions /
 * Délégations / Historique — Utilisateurs is the root even though Rôles/
 * Permissions were built first (Gate 1); order reflects the approved IA,
 * not build sequence, mirroring `ParametresNav`'s own UI-010BC growth.
 * Never added to the global sidebar (task §5's own explicit rule).
 */
export function AccessGovernanceNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const activeKey = resolveActiveSection(pathname);

  const items: TabItem[] = [
    { key: "users", label: t("access.nav.users"), href: "/app/parametres/access" },
    { key: "roles", label: t("access.nav.roles"), href: "/app/parametres/access/roles" },
    { key: "permissions", label: t("access.nav.permissions"), href: "/app/parametres/access/permissions" },
    { key: "delegations", label: t("access.nav.delegations"), href: "/app/parametres/access/delegations" },
    { key: "historique", label: t("access.nav.historique"), href: "/app/parametres/access/historique" },
  ];

  return <Tabs ariaLabel={t("access.nav.navigationLabel")} activeKey={activeKey} items={items} />;
}
