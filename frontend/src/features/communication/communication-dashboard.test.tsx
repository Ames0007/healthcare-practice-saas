import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { CommunicationDashboard } from "./communication-dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/communication",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof CommunicationDashboard> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <CommunicationDashboard {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("CommunicationDashboard", () => {
  it("renders the header and the Vue d'ensemble tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Communication" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Messages en échec")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("computes the three KPIs from the fixture set", () => {
    renderPage("fr");

    const failedCard = screen.getByText("Messages en échec").closest("div.rounded-lg") as HTMLElement;
    expect(within(failedCard).getByText("1")).toBeInTheDocument();
    const queuedCard = screen.getByText("Messages en attente").closest("div.rounded-lg") as HTMLElement;
    expect(within(queuedCard).getByText("3")).toBeInTheDocument();
    const volumeCard = screen.getByText("Messages envoyés (7 derniers jours)").closest("div.rounded-lg") as HTMLElement;
    expect(within(volumeCard).getByText("10")).toBeInTheDocument();
  });

  it("lists the failed message with its reason, and the pending messages", () => {
    renderPage("fr");

    const failedSection = screen.getByText("Échecs à relancer").closest("div.rounded-lg") as HTMLElement;
    expect(within(failedSection).getByText("Mehdi Berrada")).toBeInTheDocument();
    expect(within(failedSection).getByText("Numéro de téléphone invalide ou injoignable.")).toBeInTheDocument();

    const pendingSection = screen.getByText("En attente d'envoi").closest("div.rounded-lg") as HTMLElement;
    expect(within(pendingSection).getAllByText("Mehdi Berrada").length).toBeGreaterThan(0);
    expect(within(pendingSection).getByText("Nadia El Fassi")).toBeInTheDocument();
  });

  it("retries a failed message: it disappears from Failed and the KPIs update", () => {
    renderPage("fr");

    const failedSection = screen.getByText("Échecs à relancer").closest("div.rounded-lg") as HTMLElement;
    fireEvent.click(within(failedSection).getByRole("button", { name: "Réessayer" }));

    expect(screen.getByText("Aucun message en échec.")).toBeInTheDocument();
    const failedCard = screen.getByText("Messages en échec").closest("div.rounded-lg") as HTMLElement;
    expect(within(failedCard).getByText("0")).toBeInTheDocument();
    const queuedCard = screen.getByText("Messages en attente").closest("div.rounded-lg") as HTMLElement;
    expect(within(queuedCard).getByText("4")).toBeInTheDocument();
  });

  it("composes and sends a new message to an existing patient, filling the body from a template", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau message" }));

    fireEvent.change(screen.getByLabelText("Patient *"), { target: { value: "Ahmed" } });
    fireEvent.click(screen.getByRole("option", { name: /Ahmed El Mansouri/ }));

    fireEvent.change(screen.getByLabelText("Modèle"), { target: { value: "tpl-2" } });
    expect(screen.getByLabelText("Message *")).toHaveValue("Bonjour Ahmed, rappel de votre rendez-vous le — à — avec Dr. Benali.");
    expect(screen.getByLabelText("Canal *")).toHaveValue("whatsapp");

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const volumeCard = screen.getByText("Messages envoyés (7 derniers jours)").closest("div.rounded-lg") as HTMLElement;
    expect(within(volumeCard).getByText("11")).toBeInTheDocument();
  });

  it("rejects sending without a selected patient", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau message" }));
    fireEvent.change(screen.getByLabelText("Message *"), { target: { value: "Bonjour" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(screen.getAllByText("Ce champ est obligatoire.").length).toBeGreaterThan(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "التواصل" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
