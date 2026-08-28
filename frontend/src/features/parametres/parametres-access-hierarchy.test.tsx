import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { CabinetSettingsPage } from "./cabinet-settings-page";
import { ServicesPage } from "./services-page";
import { WorkingHoursPage } from "./working-hours-page";
import { AppointmentSettingsPage } from "./appointment-settings-page";
import { PaymentMethodsPage } from "./payment-methods-page";
import { NumberingPage } from "./numbering-page";
import { DocumentSettingsPage } from "./document-settings-page";
import { UsersPage } from "@/features/access/users-page";
import { RolesPage } from "@/features/access/roles-page";
import { PermissionsPage } from "@/features/access/permissions-page";
import { DelegationsPage } from "@/features/access/delegations-page";
import { HistoriquePage } from "@/features/access/historique-page";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const PARAMETRES_NAV_LABEL = "Navigation Paramètres";
const ACCESS_NAV_LABEL = "Navigation Accès & permissions";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderAt(pathname: string, ui: React.ReactElement, locale: Locale = "fr") {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>{ui}</DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

/**
 * UI-011X-FIX regression suite: proves every Paramètres route (including
 * the nested Accès & permissions routes) preserves the full three-level
 * hierarchy — Main sidebar (untouched, outside scope here) -> ParametresNav
 * (Level 2) -> AccessGovernanceNav (Level 3, Access routes only). Access
 * pages had regressed to rendering only `AccessGovernanceNav`, silently
 * dropping `ParametresNav`; these tests fail on that regression shape.
 */
describe("Paramètres navigation hierarchy (UI-011X-FIX)", () => {
  it("Cabinet route renders ParametresNav", () => {
    renderAt("/app/parametres", <CabinetSettingsPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
  });

  it("Services route renders ParametresNav", () => {
    renderAt("/app/parametres/services", <ServicesPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
  });

  it("Horaires route renders ParametresNav", () => {
    renderAt("/app/parametres/horaires", <WorkingHoursPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
  });

  it("Rendez-vous route renders ParametresNav", () => {
    renderAt("/app/parametres/rendez-vous", <AppointmentSettingsPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
  });

  it("Paiements route renders ParametresNav", () => {
    renderAt("/app/parametres/paiements", <PaymentMethodsPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
  });

  it("Numérotation route renders ParametresNav", () => {
    renderAt("/app/parametres/numerotation", <NumberingPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
  });

  it("Documents route renders ParametresNav", () => {
    renderAt("/app/parametres/documents", <DocumentSettingsPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
  });

  it("Access/Users renders ParametresNav", () => {
    renderAt("/app/parametres/access", <UsersPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
  });

  it("Access/Users renders AccessGovernanceNav", () => {
    renderAt("/app/parametres/access", <UsersPage />);
    expect(screen.getByRole("navigation", { name: ACCESS_NAV_LABEL })).toBeInTheDocument();
  });

  it("Roles renders BOTH navs", () => {
    renderAt("/app/parametres/access/roles", <RolesPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: ACCESS_NAV_LABEL })).toBeInTheDocument();
  });

  it("Permissions renders BOTH navs", () => {
    renderAt("/app/parametres/access/permissions", <PermissionsPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: ACCESS_NAV_LABEL })).toBeInTheDocument();
  });

  it("Delegations renders BOTH navs", () => {
    renderAt("/app/parametres/access/delegations", <DelegationsPage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: ACCESS_NAV_LABEL })).toBeInTheDocument();
  });

  it("History renders BOTH navs", () => {
    renderAt("/app/parametres/access/historique", <HistoriquePage />);
    expect(screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: ACCESS_NAV_LABEL })).toBeInTheDocument();
  });

  it("ParametresNav contains exactly the existing seven sections plus Access", () => {
    renderAt("/app/parametres", <CabinetSettingsPage />);
    const nav = screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL });
    const labels = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual([
      "Cabinet",
      "Services & tarifs",
      "Horaires",
      "Rendez-vous",
      "Paiements",
      "Numérotation",
      "Documents",
      "Accès & permissions",
    ]);
  });

  it("existing seven hrefs remain unchanged", () => {
    renderAt("/app/parametres", <CabinetSettingsPage />);
    const nav = screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL });
    expect(within(nav).getByRole("link", { name: "Cabinet" })).toHaveAttribute("href", "/app/parametres");
    expect(within(nav).getByRole("link", { name: "Services & tarifs" })).toHaveAttribute("href", "/app/parametres/services");
    expect(within(nav).getByRole("link", { name: "Horaires" })).toHaveAttribute("href", "/app/parametres/horaires");
    expect(within(nav).getByRole("link", { name: "Rendez-vous" })).toHaveAttribute("href", "/app/parametres/rendez-vous");
    expect(within(nav).getByRole("link", { name: "Paiements" })).toHaveAttribute("href", "/app/parametres/paiements");
    expect(within(nav).getByRole("link", { name: "Numérotation" })).toHaveAttribute("href", "/app/parametres/numerotation");
    expect(within(nav).getByRole("link", { name: "Documents" })).toHaveAttribute("href", "/app/parametres/documents");
  });

  it("AccessGovernanceNav contains exactly Utilisateurs/Rôles/Permissions/Délégations/Historique", () => {
    renderAt("/app/parametres/access", <UsersPage />);
    const nav = screen.getByRole("navigation", { name: ACCESS_NAV_LABEL });
    const labels = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual(["Utilisateurs", "Rôles", "Permissions", "Délégations", "Historique"]);
  });

  it("Access sub-items do not appear in ParametresNav", () => {
    renderAt("/app/parametres/access", <UsersPage />);
    const parametresNav = screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL });
    expect(within(parametresNav).queryByRole("link", { name: "Rôles" })).not.toBeInTheDocument();
    expect(within(parametresNav).queryByRole("link", { name: "Délégations" })).not.toBeInTheDocument();
  });

  it("AccessGovernanceNav does not appear on Documents", () => {
    renderAt("/app/parametres/documents", <DocumentSettingsPage />);
    expect(screen.queryByRole("navigation", { name: ACCESS_NAV_LABEL })).not.toBeInTheDocument();
  });

  it("AccessGovernanceNav does not appear on Services", () => {
    renderAt("/app/parametres/services", <ServicesPage />);
    expect(screen.queryByRole("navigation", { name: ACCESS_NAV_LABEL })).not.toBeInTheDocument();
  });

  it("nested Access route keeps Accès & permissions active at Level 2, Cabinet inactive", () => {
    renderAt("/app/parametres/access/roles", <RolesPage />);
    const parametresNav = screen.getByRole("navigation", { name: PARAMETRES_NAV_LABEL });
    expect(within(parametresNav).getByRole("link", { name: "Accès & permissions" })).toHaveAttribute("aria-current", "page");
    expect(within(parametresNav).getByRole("link", { name: "Cabinet" })).not.toHaveAttribute("aria-current");
  });

  it("nested Access route activates the correct Level-3 item, Utilisateurs inactive", () => {
    renderAt("/app/parametres/access/roles", <RolesPage />);
    const accessNav = screen.getByRole("navigation", { name: ACCESS_NAV_LABEL });
    expect(within(accessNav).getByRole("link", { name: "Rôles" })).toHaveAttribute("aria-current", "page");
    expect(within(accessNav).getByRole("link", { name: "Utilisateurs" })).not.toHaveAttribute("aria-current");
  });

  it("renders both navigation levels in Arabic/RTL", () => {
    renderAt("/app/parametres/access/roles", <RolesPage />, "ar");
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "تنقل الإعدادات" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "تنقل الوصول والصلاحيات" })).toBeInTheDocument();
  });
});
