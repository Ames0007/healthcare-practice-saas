import { Activity, Building2, CreditCard, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

export interface AdminNavItem {
  id: string;
  translationKey: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Platform Admin navigation (UI-013ABCDE Gate 1 §07). Replaces TASK-003's
 * 8-item static placeholder (`dashboard/cabinets/subscriptions/plans/
 * masterData/referrals/operations/audit`) with exactly the 5 surfaces this
 * task actually implements — task §7's own "Potential navigation" list.
 * `Plans`/`Master Data`/`Referrals` (Spec #2 §55.3/§55.4/§55.5) are real,
 * spec-defined future screens, not invented ones, but this task's own Gate
 * scope (§1) never asked for them; see `docs/implementation/DECISIONS.md`
 * for the recorded scope boundary rather than silently leaving three dead
 * nav links pointing at an unimplemented placeholder.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: "dashboard", translationKey: "admin.nav.dashboard", href: "/admin", icon: LayoutDashboard },
  { id: "tenants", translationKey: "admin.nav.cabinets", href: "/admin/tenants", icon: Building2 },
  { id: "subscriptions", translationKey: "admin.nav.subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { id: "users", translationKey: "admin.nav.users", href: "/admin/users", icon: Users },
  { id: "activity", translationKey: "admin.nav.activity", href: "/admin/activity", icon: Activity },
];
