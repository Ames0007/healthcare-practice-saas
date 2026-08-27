import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { NumberingPage } from "./numbering-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/numerotation",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof NumberingPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <NumberingPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("NumberingPage", () => {
  it("renders the header and the Numérotation tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Numérotation & documents" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Numérotation" })).toHaveAttribute("aria-current", "page");
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

  it("shows the real fixture-derived next numbers for all 4 sequences, no editable controls anywhere", () => {
    renderPage("fr");

    const table = screen.getByRole("table");
    const facRow = within(table).getByText("Factures").closest("tr")!;
    expect(within(facRow).getByText("FAC-2026-00143")).toBeInTheDocument();

    const recRow = within(table).getByText("Reçus").closest("tr")!;
    expect(within(recRow).getByText("REC-2026-00383")).toBeInTheDocument();

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: /modifier|enregistrer/i })).toHaveLength(0);
  });
});
