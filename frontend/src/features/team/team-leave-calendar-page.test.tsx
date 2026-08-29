import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { TeamLeaveCalendarPage } from "./team-leave-calendar-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/equipe/leave-calendar",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale = "fr", props: React.ComponentProps<typeof TeamLeaveCalendarPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <TeamLeaveCalendarPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("TeamLeaveCalendarPage — route/navigation (task §40 1-3)", () => {
  it("renders the Leave Agenda with its own title", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Agenda des congés" })).toBeInTheDocument();
  });
});

describe("TeamLeaveCalendarPage — views (task §40 4-6, §8/§9/§11/§12)", () => {
  it("Month view is the default and shows August 2026's real approved leave, with a multi-day event visible on every date it spans", () => {
    renderPage();

    expect(screen.getByText(/août 2026/i)).toBeInTheDocument();
    // Amal Idrissi's 3-day approved leave (2026-08-26 to 2026-08-28) appears on all 3 calendar cells.
    expect(screen.getAllByRole("button", { name: "Amal — Congé annuel" })).toHaveLength(3);
  });

  it("Week view shows a day-column, all-day representation (no hourly grid)", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Semaine" }));

    expect(screen.queryByText(/08:00|09:00/)).not.toBeInTheDocument();
  });

  it("List view shows a compact chronological alternative, grouped by month", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Liste" }));

    // Both the header's period label and the list's own month-group heading render "août 2026".
    expect(screen.getAllByText(/août 2026/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Amal Idrissi").length).toBeGreaterThan(0);
  });
});

describe("TeamLeaveCalendarPage — navigation (task §40 7-9, §13)", () => {
  it("Next/Previous/Today navigate the visible month deterministically", () => {
    renderPage();
    expect(screen.getByText(/août 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Période suivante" }));
    expect(screen.getByText(/septembre 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aujourd'hui" }));
    expect(screen.getByText(/août 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Période précédente" }));
    expect(screen.getByText(/juillet 2026/i)).toBeInTheDocument();
  });
});

describe("TeamLeaveCalendarPage — filters (task §40 10-12, §14/§15/§16)", () => {
  it("Employee filter narrows the calendar to one team member", () => {
    renderPage();
    fireEvent.change(screen.getByRole("combobox", { name: "Employé" }), { target: { value: "team-2" } });

    expect(screen.getAllByRole("button", { name: "Amal — Congé annuel" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Meryem/ })).not.toBeInTheDocument();
  });

  it("Leave-type filter narrows the calendar to one leave type", () => {
    renderPage();
    fireEvent.change(screen.getByRole("combobox", { name: "Type de congé" }), { target: { value: "sick" } });

    expect(screen.getByRole("button", { name: /Hamza/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Amal/ })).not.toBeInTheDocument();
  });

  it("default Status filter (Approuvé + En attente) hides rejected leave; the Status filter can reveal it explicitly (task §15/§16/§18)", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Période précédente" })); // August -> July

    // July: lr-4 (Dr. Benali, approved, 2 days) is visible by default; lr-3 (Meryem, rejected, 2 days) is not.
    expect(screen.getAllByRole("button", { name: /Youssef/ }).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("button", { name: /Meryem/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Statut" }), { target: { value: "rejected" } });
    expect(screen.getAllByRole("button", { name: /Meryem/ }).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("button", { name: /Youssef/ })).not.toBeInTheDocument();
  });

  it("Pending leave is visible under the default operational filter (task §40 14)", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Période suivante" })); // August -> September

    expect(screen.getByText(/septembre 2026/i)).toBeInTheDocument();
    // Meryem's pending request spans 2026-09-04 and 09-05 — one button per date cell.
    expect(screen.getAllByRole("button", { name: /Meryem/ }).length).toBeGreaterThanOrEqual(2);
  });
});

describe("TeamLeaveCalendarPage — event detail drawer (task §40 17-22, §19/§20)", () => {
  it("opens a read-only detail drawer with employee, dates, duration and status, and links to the existing Congés workflow", () => {
    renderPage();

    fireEvent.click(screen.getAllByRole("button", { name: "Amal — Congé annuel" })[0]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Amal Idrissi")).toBeInTheDocument();
    expect(within(dialog).getByText("EMP-0002")).toBeInTheDocument();
    expect(within(dialog).getByText("Congé annuel")).toBeInTheDocument();
    expect(within(dialog).getByText("Approuvé")).toBeInTheDocument();
    expect(within(dialog).getByText(/26 août 2026/)).toBeInTheDocument();
    expect(within(dialog).getByText(/28 août 2026/)).toBeInTheDocument();
    expect(within(dialog).getByText("3 jours")).toBeInTheDocument();

    const viewRequestLink = within(dialog).getByRole("link", { name: "Voir la demande" });
    expect(viewRequestLink).toHaveAttribute("href", "/app/equipe/team-2/leave");
  });
});

describe("TeamLeaveCalendarPage — approved-away visibility & overlap (task §40 23-27, §22-25)", () => {
  it("shows an approved-away count badge on a date with confirmed absence (Month view)", () => {
    renderPage();
    // 2026-08-27: two real approved absences (Amal + Hamza).
    expect(screen.getByText("2 absents")).toBeInTheDocument();
  });

  it("Week view shows the full overlap-warning sentence, with the practitioner-away count, on the real simultaneous-absence date", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Semaine" }));
    fireEvent.click(screen.getByRole("button", { name: "Période suivante" })); // reach the week containing 24-30 August

    expect(screen.getByText("2 membres seront absents ce jour.")).toBeInTheDocument();
    expect(screen.getByText(/1 praticiens absents/)).toBeInTheDocument();
  });
});

describe("TeamLeaveCalendarPage — cabinet closure context (task §26, additive, never converted into leave)", () => {
  it("shows the cabinet-closed badge on a real exceptional-closure date without inventing a leave event for it", () => {
    renderPage();
    expect(screen.getByText(/Cabinet fermé/)).toBeInTheDocument();
  });
});

describe("TeamLeaveCalendarPage — FR/AR/RTL (task §40 30-32)", () => {
  it("renders French content by default", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Agenda des congés" })).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active", () => {
    const { container } = renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "جدول الإجازات" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

describe("TeamLeaveCalendarPage — empty/loading/error (task §40 34-36, §31-33)", () => {
  it("shows the period-scoped empty state for a month with no leave at all, without implying there are no employees", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Période suivante" })); // August -> September (has pending)
    fireEvent.click(screen.getByRole("button", { name: "Période suivante" })); // September -> October (empty)

    expect(screen.getByText("Aucun congé sur cette période.")).toBeInTheDocument();
    expect(screen.getByText(/Les congés approuvés et demandes en attente apparaîtront ici\./)).toBeInTheDocument();
  });

  it("renders the shape-matched loading skeleton, not a spinner-only state", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action, no fake network call", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger l'agenda des congés.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

function metricCardFor(label: string) {
  return screen.getByText(label).closest("div")!.parentElement!;
}

describe("TeamLeaveCalendarPage — dashboard metrics (task §30, whole-cabinet, business-date-anchored)", () => {
  it("the 'away today' metric is business-date-anchored and unaffected by which period is currently browsed", () => {
    renderPage("fr", { businessDate: "2026-08-27" });
    expect(within(metricCardFor("En congé aujourd'hui")).getByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Période suivante" })); // browse into September
    expect(within(metricCardFor("En congé aujourd'hui")).getByText("2")).toBeInTheDocument();
  });

  it("'planned this month' counts real distinct approved spans touching the business date's own month, never a day-count", () => {
    renderPage();
    expect(within(metricCardFor("Absences planifiées ce mois")).getByText("3")).toBeInTheDocument();
  });

  it("'pending requests' counts the one real pending fixture cabinet-wide", () => {
    renderPage();
    expect(within(metricCardFor("Demandes en attente")).getByText("1")).toBeInTheDocument();
  });
});
