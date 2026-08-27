import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { ServicesPage } from "./services-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/services",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof ServicesPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <ServicesPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("ServicesPage", () => {
  it("renders the header and the Services & tarifs tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Services & tarifs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Services & tarifs" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("reproduces the spec's own worked example row (Consultation — 400 MAD — 30 min)", () => {
    renderPage("fr");

    const table = screen.getByRole("table");
    const row = within(table).getByText("Consultation").closest("tr")!;
    expect(within(row).getByText("400 MAD")).toBeInTheDocument();
    expect(within(row).getByText("30 min")).toBeInTheDocument();
    expect(within(row).getByText("Heure fixe")).toBeInTheDocument();
  });

  it("Ajouter un service opens the add dialog with blank fields", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un service" }));
    expect(screen.getByRole("heading", { name: "Ajouter un service" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nom du service *")).toHaveValue("");
  });

  it("submitting a valid new service adds a row to the table", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un service" }));

    fireEvent.change(screen.getByLabelText("Nom du service *"), { target: { value: "Blanchiment dentaire" } });
    fireEvent.change(screen.getByLabelText("Durée (minutes) *"), { target: { value: "60" } });
    fireEvent.change(screen.getByLabelText("Prix (MAD) *"), { target: { value: "600" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const table = screen.getByRole("table");
    expect(within(table).getByText("Blanchiment dentaire")).toBeInTheDocument();
  });

  it("Modifier on one row pre-fills that row's own values, not another row's", () => {
    renderPage("fr");

    const table = screen.getByRole("table");
    const kineRow = within(table).getByText("Séance de kinésithérapie").closest("tr")!;
    fireEvent.click(within(kineRow).getByRole("button", { name: "Modifier" }));

    expect(screen.getByLabelText("Nom du service *")).toHaveValue("Séance de kinésithérapie");
    expect(screen.getByLabelText("Prix (MAD) *")).toHaveValue(300);
  });

  it("editing then switching to a different row's Modifier shows the new row's own values, not stale data", () => {
    renderPage("fr");

    let table = screen.getByRole("table");
    fireEvent.click(within(within(table).getByText("Consultation").closest("tr")!).getByRole("button", { name: "Modifier" }));
    expect(screen.getByLabelText("Nom du service *")).toHaveValue("Consultation");
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    table = screen.getByRole("table");
    fireEvent.click(within(within(table).getByText("Contrôle").closest("tr")!).getByRole("button", { name: "Modifier" }));
    expect(screen.getByLabelText("Nom du service *")).toHaveValue("Contrôle");
  });
});
