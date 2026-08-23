import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { TodayDashboard } from "./today-dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}));

/** Mirrors what the root layout does: applies `dir` from the resolved locale. */
function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderDashboard(initialLocale: Locale, props: React.ComponentProps<typeof TodayDashboard> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <TodayDashboard {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("TodayDashboard", () => {
  it("renders the French dashboard: header, KPIs, next appointment, agenda, attention and finance", () => {
    renderDashboard("fr");

    // 1/7. Aujourd'hui renders, FR translations render.
    expect(screen.getByRole("heading", { level: 1, name: "Aujourd'hui" })).toBeInTheDocument();
    expect(screen.getByText("Bonjour Dr. Benali")).toBeInTheDocument();

    // 2. KPI values render.
    expect(screen.getByText("Rendez-vous")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();

    // 3. Next appointment renders.
    expect(screen.getByText("Prochain rendez-vous")).toBeInTheDocument();
    // "10:30" renders both in the prominent Next Appointment card and its
    // Agenda row (same appointment) — assert at least one, not exactly one.
    expect(screen.getAllByText("10:30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ahmed El Mansouri").length).toBeGreaterThan(0);

    // 4. Agenda rows render.
    expect(screen.getByText("Fatima Zahra")).toBeInTheDocument();
    expect(screen.getByText("Youssef Amrani")).toBeInTheDocument();
    expect(screen.getByText("Sara Alaoui")).toBeInTheDocument();
    expect(screen.getByText("Karim Idrissi")).toBeInTheDocument();

    // 5. Attention items render.
    expect(screen.getByText("À faire")).toBeInTheDocument();
    expect(screen.getByText("3 rendez-vous à confirmer")).toBeInTheDocument();
    expect(screen.getByText("2 échéances en retard")).toBeInTheDocument();
    expect(screen.getByText("1 patient à rappeler")).toBeInTheDocument();
    expect(screen.getByText("2 articles en stock faible")).toBeInTheDocument();

    // 6. Financial snapshot renders.
    expect(screen.getByText("Finances aujourd'hui")).toBeInTheDocument();
    expect(screen.getByText("2 400 MAD")).toBeInTheDocument();
    expect(screen.getByText("800 MAD")).toBeInTheDocument();
    expect(screen.getByText("350 MAD")).toBeInTheDocument();
    expect(screen.getByText("3 050 MAD")).toBeInTheDocument();
  });

  it("renders Arabic translations with RTL active (8/9)", () => {
    const { container } = renderDashboard("ar");

    expect(screen.getByRole("heading", { level: 1, name: "اليوم" })).toBeInTheDocument();
    expect(screen.getByText("مرحباً Dr. Benali")).toBeInTheDocument();
    expect(screen.getByText("جدول اليوم")).toBeInTheDocument();
    expect(screen.getByText("المالية اليوم")).toBeInTheDocument();

    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it("updates the appointment status locally when 'Patient arrivé' is clicked, without navigating or persisting", () => {
    renderDashboard("fr");

    // Before: Ahmed (next appointment) + Ahmed (agenda row) + Karim (agenda row) are "Confirmé".
    expect(screen.getAllByText("Confirmé")).toHaveLength(3);
    expect(screen.queryByText("Arrivé")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Patient arrivé" }));

    // After: only Karim remains "Confirmé"; Ahmed's two renderings become "Arrivé".
    expect(screen.getAllByText("Confirmé")).toHaveLength(1);
    expect(screen.getAllByText("Arrivé")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Patient arrivé" })).not.toBeInTheDocument();
  });

  it("renders the empty-day state with a create-appointment action to the agenda placeholder (11)", () => {
    renderDashboard("fr", { state: "empty" });

    expect(screen.getByText("Aucun rendez-vous aujourd'hui.")).toBeInTheDocument();
    expect(screen.getByText("Votre journée est libre pour le moment.")).toBeInTheDocument();

    const action = screen.getByRole("link", { name: "Créer un rendez-vous" });
    expect(action).toHaveAttribute("href", "/app/agenda");

    expect(screen.queryByText("Prochain rendez-vous")).not.toBeInTheDocument();
  });

  it("renders the loading skeleton without appointment content", () => {
    renderDashboard("fr", { state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Prochain rendez-vous")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderDashboard("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les informations du jour.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
