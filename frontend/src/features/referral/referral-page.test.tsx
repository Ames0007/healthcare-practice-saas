import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { ReferralPage } from "./referral-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/abonnement/parrainage",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof ReferralPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <ReferralPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("ReferralPage", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("renders the header and the Parrainage tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Parrainage" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Parrainage" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Cabinet Atlas")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the derived code and Screen 50's own link format", () => {
    renderPage("fr");

    expect(screen.getByText("CABIN7X2")).toBeInTheDocument();
    expect(screen.getByText("app.ma/r/CABIN7X2")).toBeInTheDocument();
  });

  it("Copier le lien writes the real link to the clipboard and shows a confirmation toast", async () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "Copier le lien" }));

    await screen.findByText("Lien copié.");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("app.ma/r/CABIN7X2");
  });

  it("lists every referral with its status badge", () => {
    renderPage("fr");

    const atlasRow = screen.getByText("Cabinet Atlas").closest("li") as HTMLElement;
    expect(within(atlasRow).getByText("Essai")).toBeInTheDocument();

    const zenithRow = screen.getByText("Cabinet Zenith").closest("li") as HTMLElement;
    expect(within(zenithRow).getByText("Rejeté")).toBeInTheDocument();
  });

  it("shows +1 mois only next to the qualified referral with an applied reward, never on any other row", () => {
    renderPage("fr");

    const santeRow = screen.getByText("Cabinet Santé Plus").closest("li") as HTMLElement;
    expect(within(santeRow).getByText("Validé")).toBeInTheDocument();
    expect(within(santeRow).getByText("+1 mois")).toBeInTheDocument();

    const atlasRow = screen.getByText("Cabinet Atlas").closest("li") as HTMLElement;
    expect(within(atlasRow).queryByText(/\+\d+ mois/)).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no referrals", () => {
    renderPage("fr", { referrals: [] });
    expect(screen.getByText("Aucun parrainage pour le moment.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "الإحالة" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
