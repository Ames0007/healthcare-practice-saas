import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Home,
  MessageSquare,
  Package,
  Settings,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  translationKey: string;
  href: string;
  icon: LucideIcon;
  /** Shown on the mobile bottom bar (Spec #7 §39 / #8 §24). */
  mobilePrimary?: boolean;
}

/**
 * Single source of truth for primary navigation (Spec #8 §76: "Navigation
 * items come from centralized configuration filtered by
 * permission/entitlement/specialty context. Do not hardcode sidebar
 * separately for every role.").
 *
 * TASK-003 has no permission/entitlement/subscription system yet, so this
 * list is unfiltered. A later task adds a filter over this same array
 * rather than introducing per-role sidebar variants.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "aujourdhui", translationKey: "nav.aujourdhui", href: "/app", icon: Home, mobilePrimary: true },
  { id: "agenda", translationKey: "nav.agenda", href: "/app/agenda", icon: CalendarDays, mobilePrimary: true },
  { id: "patients", translationKey: "nav.patients", href: "/app/patients", icon: Users, mobilePrimary: true },
  { id: "finance", translationKey: "nav.finance", href: "/app/finance", icon: Wallet },
  { id: "equipe", translationKey: "nav.equipe", href: "/app/equipe", icon: UserRound },
  { id: "stock", translationKey: "nav.stock", href: "/app/stock", icon: Package },
  { id: "communication", translationKey: "nav.communication", href: "/app/communication", icon: MessageSquare },
  { id: "rapports", translationKey: "nav.rapports", href: "/app/rapports", icon: BarChart3 },
  { id: "parametres", translationKey: "nav.parametres", href: "/app/parametres", icon: Settings },
  { id: "abonnement", translationKey: "nav.abonnement", href: "/app/abonnement", icon: CreditCard },
];

/** Primary mobile bottom-nav destinations (Spec #7 §39: Aujourd'hui, Agenda, Patients, Plus). */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.mobilePrimary);
