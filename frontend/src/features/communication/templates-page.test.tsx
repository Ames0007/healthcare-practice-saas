import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { TemplatesPage } from "./templates-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/communication/templates",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof TemplatesPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <TemplatesPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("TemplatesPage", () => {
  it("renders the header and the Modèles tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Communication" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Modèles" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Confirmation de rendez-vous")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("reproduces Spec Screen 42's own worked example (Arabic appointment reminder template)", () => {
    renderPage("fr");

    const row = screen.getByText("تذكير بالموعد").closest("li")!;
    expect(within(row).getByText("WhatsApp")).toBeInTheDocument();
    expect(within(row).getByText("Arabe")).toBeInTheDocument();
    expect(within(row).getByText("Actif")).toBeInTheDocument();
  });

  it("marks the inactive fixture template distinctly", () => {
    renderPage("fr");

    const row = screen.getByText("Relance impayé").closest("li")!;
    expect(within(row).getByText("Inactif")).toBeInTheDocument();
  });

  it("adds a new template through the form dialog and shows it in the list", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau modèle" }));
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "Bienvenue" } });
    fireEvent.change(screen.getByLabelText("Message *"), { target: { value: "Bonjour {{patient_first_name}}, bienvenue." } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Bienvenue")).toBeInTheDocument();
  });

  it("rejects submitting the add form without a required name/body", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau modèle" }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getAllByText("Ce champ est obligatoire.").length).toBeGreaterThan(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("inserts a variable token into the body when clicked", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau modèle" }));
    fireEvent.click(screen.getByRole("button", { name: "{{patient_first_name}}" }));

    expect(screen.getByLabelText("Message *")).toHaveValue("{{patient_first_name}}");
  });

  it("renders a live preview of the body against the sample context", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau modèle" }));
    fireEvent.change(screen.getByLabelText("Message *"), { target: { value: "Bonjour {{patient_first_name}}" } });

    expect(screen.getByText("Bonjour Ahmed")).toBeInTheDocument();
  });

  it("edits an existing template through the [Modifier] action", () => {
    renderPage("fr");

    const row = screen.getByText("Confirmation standard").closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Modifier" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Nom *")).toHaveValue("Confirmation standard");

    fireEvent.change(within(dialog).getByLabelText("Nom *"), { target: { value: "Confirmation RDV (modifié)" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Confirmation RDV (modifié)")).toBeInTheDocument();
  });

  it("renders an empty state with no templates", () => {
    renderPage("fr", { templates: [] });
    expect(screen.getByText("Aucun modèle pour le moment.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "التواصل" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
