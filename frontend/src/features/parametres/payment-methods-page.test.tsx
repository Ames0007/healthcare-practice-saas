import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { PaymentMethodsPage } from "./payment-methods-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/paiements",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof PaymentMethodsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PaymentMethodsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("PaymentMethodsPage", () => {
  it("renders the header and the Paiements tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Paiements" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Paiements" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Espèces")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("lists exactly the cash payment method as active, with no edit affordance and an explanatory note", () => {
    renderPage("fr");

    const row = screen.getByRole("row", { name: /Espèces/ });
    expect(within(row).getByText("Espèces")).toBeInTheDocument();
    expect(within(row).getByText("Actif")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    expect(screen.getByText(/paiements en espèces/)).toBeInTheDocument();
  });
});
