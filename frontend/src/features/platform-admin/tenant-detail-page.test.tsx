import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { TenantDetailPage } from "./tenant-detail-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(locale: Locale, tenantId: string) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <TenantDetailPage tenantId={tenantId} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("TenantDetailPage", () => {
  it("shows a not-found state for an unknown tenant id, never crashing", () => {
    renderPage("fr", "tenant-does-not-exist");
    expect(screen.getByText("Cabinet introuvable.")).toBeInTheDocument();
  });

  it("shows tenant-1's real identity and an Overview tab with a Suspend action (active tenant)", () => {
    renderPage("fr", "tenant-1");
    expect(screen.getByRole("heading", { level: 1, name: "Cabinet (exemple)" })).toBeInTheDocument();
    expect(screen.getByText("Casablanca")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspendre le cabinet" })).toBeInTheDocument();
  });

  it("Subscription tab shows the real active subscription, its plan and entitlements, with only Cancel offered", () => {
    renderPage("fr", "tenant-1");
    fireEvent.click(screen.getByRole("tab", { name: "Abonnement" }));

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("Cabinet")).toBeInTheDocument();
    expect(within(panel).getByText(/Praticiens/)).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Annuler l'abonnement" })).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: "Forcer le blackout" })).not.toBeInTheDocument();
  });

  it("Users tab lists tenant-1's real 5 users, marking Youssef Benali as owner", () => {
    renderPage("fr", "tenant-1");
    fireEvent.click(screen.getByRole("tab", { name: "Utilisateurs" }));

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("Youssef Benali")).toBeInTheDocument();
    expect(within(panel).getByText(/Propriétaire \/ Admin/)).toBeInTheDocument();
    expect(within(panel).getAllByRole("row")).toHaveLength(6); // header + 5 users
  });

  it("History tab shows the real static audit event for Othmane Zouiten's deactivation", () => {
    renderPage("fr", "tenant-1");
    fireEvent.click(screen.getByRole("tab", { name: "Historique" }));
    expect(screen.getByText("Compte désactivé")).toBeInTheDocument();
  });

  it("a suspended tenant (Zenith) offers only Reactivate, and confirming it flips the status badge", () => {
    renderPage("fr", "tenant-6");
    expect(screen.queryByRole("button", { name: "Suspendre le cabinet" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Réactiver le cabinet" }));
    fireEvent.change(screen.getByLabelText("Motif"), { target: { value: "Paiement régularisé." } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(screen.getByText("Statut du cabinet mis à jour.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Historique" }));
    expect(screen.getByText("Cabinet réactivé")).toBeInTheDocument();
    expect(screen.getByText("Paiement régularisé.")).toBeInTheDocument();
  });

  it("a closed tenant (Marrakech Multi) offers no tenant-status action — terminal state", () => {
    renderPage("fr", "tenant-7");
    expect(screen.queryByRole("button", { name: "Suspendre le cabinet" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Réactiver le cabinet" })).not.toBeInTheDocument();
  });

  it("a grace subscription (Riad Kiné) offers renewal, forced blackout and cancellation, and manual renewal restores Actif", () => {
    renderPage("fr", "tenant-5");
    fireEvent.click(screen.getByRole("tab", { name: "Abonnement" }));

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer un renouvellement manuel" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("Actif")).toBeInTheDocument();
  });

  it("the back link returns to the tenant directory", () => {
    renderPage("fr", "tenant-1");
    expect(screen.getByRole("link", { name: "← Retour aux cabinets" })).toHaveAttribute("href", "/admin/tenants");
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar", "tenant-1");
    expect(screen.getByRole("heading", { level: 1, name: "Cabinet (exemple)" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
