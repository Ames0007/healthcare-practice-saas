import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { TenantsPage } from "./tenants-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(locale: Locale) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <TenantsPage />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("TenantsPage", () => {
  it("renders the page title and every real tenant fixture", () => {
    renderPage("fr");
    expect(screen.getByRole("heading", { level: 1, name: "Cabinets" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(8); // 1 header + 7 tenants
  });

  it("reproduces Screen 55's own column layout for the real tenant-1 row", () => {
    renderPage("fr");
    const row = screen.getByText("Cabinet (exemple)").closest("tr") as HTMLElement;
    expect(within(row).getByText("Youssef Benali")).toBeInTheDocument();
    expect(within(row).getByText("Médecine générale")).toBeInTheDocument();
    expect(within(row).getByText("Cabinet")).toBeInTheDocument();
    expect(within(row).getByText("5")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Voir" })).toHaveAttribute("href", "/admin/tenants/tenant-1");
  });

  it("filters by name substring", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText("Rechercher"), { target: { value: "zenith" } });
    expect(screen.getAllByRole("row")).toHaveLength(2); // header + Cabinet Zenith
    expect(screen.getByText("Cabinet Zenith")).toBeInTheDocument();
  });

  it("filters by exact tenant status, showing the closed tenant with its own badge", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText("Statut"), { target: { value: "closed" } });
    const row = screen.getByText("Cabinet Marrakech Multi").closest("tr") as HTMLElement;
    expect(within(row).getByText("Fermé")).toBeInTheDocument();
  });

  it("filters by exact plan code", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "solo" } });
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 solo-plan tenants
  });

  it("shows an empty state when no tenant matches the filters", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText("Rechercher"), { target: { value: "no-such-cabinet" } });
    expect(screen.getByText("Aucun cabinet ne correspond à ces critères.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "العيادات" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
