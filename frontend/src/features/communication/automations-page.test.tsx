import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { AutomationsPage } from "./automations-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/communication/automations",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof AutomationsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <AutomationsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("AutomationsPage", () => {
  it("renders the header and the Automatisations tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Communication" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Automatisations" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Rendez-vous confirmé")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("lists all seven canonical event types, each showing its linked template", () => {
    renderPage("fr");

    for (const label of [
      "Rendez-vous confirmé",
      "Rappel de rendez-vous",
      "Rendez-vous modifié",
      "Rendez-vous annulé",
      "Paiement enregistré",
      "Échéance à venir",
      "Échéance en retard",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    const reminderRow = screen.getByText("Échéance à venir").closest("li")!;
    expect(within(reminderRow).getByText("Rappel d'échéance à venir")).toBeInTheDocument();
    expect(within(reminderRow).getByText("2 jour(s) avant")).toBeInTheDocument();
  });

  it("shows the deliberately inactive rule as inactive", () => {
    renderPage("fr");

    const row = screen.getByText("Échéance en retard").closest("li")!;
    expect(within(row).getByText("Inactif")).toBeInTheDocument();
    expect(within(row).getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("toggles a rule active/inactive locally, without persistence", () => {
    renderPage("fr");

    const row = screen.getByText("Rendez-vous confirmé").closest("li")!;
    const toggle = within(row).getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");

    fireEvent.click(toggle);
    expect(within(row).getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(within(row).getByText("Inactif")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "التواصل" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
