import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { MessagesPage } from "./messages-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/communication/messages",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof MessagesPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <MessagesPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

/**
 * Ahmed/Mehdi/Fatima each have more than one fixture row — locate the row
 * via its unique purpose label instead of the (ambiguous) patient name.
 * Scoped to the desktop `<table>`: `MessageCardList` renders the same
 * label again for mobile (both are present in jsdom simultaneously, only
 * CSS visibility differs), so an unscoped query would itself be ambiguous.
 */
function getRowByPurpose(purposeLabel: string): HTMLElement {
  const table = screen.getByRole("table");
  return within(table).getByText(purposeLabel).closest("tr")!;
}

describe("MessagesPage", () => {
  it("renders the header and the Messages tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Communication" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Messages" })).toHaveAttribute("aria-current", "page");
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

  it("reproduces the spec's own worked example row (Ahmed — Rappel de rendez-vous — WhatsApp — Livré)", () => {
    renderPage("fr");

    const row = getRowByPurpose("Rappel de rendez-vous");
    expect(within(row).getByText("Ahmed El Mansouri")).toBeInTheDocument();
    expect(within(row).getByText("WhatsApp")).toBeInTheDocument();
    expect(within(row).getByText("Livré")).toBeInTheDocument();
  });

  it("sorts newest first", () => {
    renderPage("fr");

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    const firstDataRowPatient = within(rows[0]).getAllByRole("button")[0];
    expect(firstDataRowPatient).toBeInTheDocument();
    expect(rows.length).toBeGreaterThan(1);
  });

  it("filters by search (patient name)", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Rechercher patient / numéro / téléphone..."), { target: { value: "Mehdi" } });
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("Mehdi Berrada").length).toBeGreaterThan(0);
    expect(within(table).queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });

  it("shows the search-empty state and clears back to the full list", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Rechercher patient / numéro / téléphone..."), { target: { value: "Zohra Inexistante" } });
    expect(screen.getByText("Aucun message ne correspond à vos critères.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Effacer la recherche" }));
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("filters by channel", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Filtrer par canal"), { target: { value: "sms" } });
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    for (const row of rows) {
      expect(within(row).getByText("SMS")).toBeInTheDocument();
    }
  });

  it("filters by status", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Filtrer par statut"), { target: { value: "failed" } });
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(within(row).getByText("Échec")).toBeInTheDocument();
    }
  });

  it("opens the read-only detail drawer with the message content", () => {
    renderPage("fr");

    const row = getRowByPurpose("Rappel de rendez-vous");
    fireEvent.click(within(row).getByRole("button", { name: "Ahmed El Mansouri" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("PAT-00281")).toBeInTheDocument();
    expect(within(dialog).getByText(/rappel de votre rendez-vous/)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Ouvrir le patient" })).toHaveAttribute("href", "/app/patients/pat-1");
  });

  it("shows the related appointment section and link when the message is linked to one", () => {
    renderPage("fr");

    const row = getRowByPurpose("Rappel de rendez-vous");
    fireEvent.click(within(row).getByRole("button", { name: "Ahmed El Mansouri" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Voir le rendez-vous" })).toHaveAttribute("href", "/app/patients/pat-1/appointments");
  });

  it("shows the related invoice section and link when the message is linked to one", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Rechercher patient / numéro / téléphone..."), { target: { value: "Mehdi" } });
    const table = screen.getByRole("table");
    fireEvent.click(within(table).getAllByRole("button", { name: "Mehdi Berrada" })[0]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("FAC-2026-00120")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Voir la facture" })).toHaveAttribute("href", "/app/patients/pat-9/invoices");
  });

  it("shows the failure reason for a failed message, with an operational retry button (Gate 3)", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Filtrer par statut"), { target: { value: "failed" } });
    const table = screen.getByRole("table");
    fireEvent.click(within(table).getByRole("button", { name: "Mehdi Berrada" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Numéro de téléphone invalide ou injoignable.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
  });

  it("retrying a failed message re-queues it, closes the drawer, and updates the list", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Filtrer par statut"), { target: { value: "failed" } });
    fireEvent.click(screen.getByRole("button", { name: "Mehdi Berrada" }));
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mehdi Berrada" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrer par statut"), { target: { value: "queued" } });
    // Mehdi now has two queued messages: the just-retried one plus the fixture's own pre-existing queued one.
    expect(screen.getAllByRole("button", { name: "Mehdi Berrada" }).length).toBe(2);
  });

  it("closes the drawer", () => {
    renderPage("fr");

    const row = getRowByPurpose("Rappel de rendez-vous");
    fireEvent.click(within(row).getByRole("button", { name: "Ahmed El Mansouri" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders an empty list state when there are no messages at all", () => {
    renderPage("fr", { messages: [] });
    expect(screen.getByText("Aucun message pour le moment.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "التواصل" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
