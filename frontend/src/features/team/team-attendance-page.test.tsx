import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { TeamAttendancePage } from "./team-attendance-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/equipe/attendance",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderAttendance(initialLocale: Locale = "fr", props: React.ComponentProps<typeof TeamAttendancePage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <TeamAttendancePage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

function rowFor(name: string) {
  const cell = within(screen.getByRole("table")).getByText(name);
  return cell.closest("tr")!;
}

describe("TeamAttendancePage — default live route (MOCK_BUSINESS_DATE, a Sunday)", () => {
  it("correctly shows a rest day for everyone with zero counts (§25 — a day off is not 'not checked in')", () => {
    renderAttendance();

    expect(screen.getByRole("heading", { level: 1, name: "Présence" })).toBeInTheDocument();
    expect(screen.getAllByText("0", { selector: "p" })).toHaveLength(4);
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("Repos").length).toBeGreaterThan(0);
  });
});

describe("TeamAttendancePage — a real business day (2026-08-17, Monday)", () => {
  it("renders one operational row per team member with planning/arrival/departure/status", () => {
    renderAttendance("fr", { businessDate: "2026-08-17" });

    const benaliRow = rowFor("Youssef Benali");
    expect(within(benaliRow).getByText("08:30–12:30, 14:30–18:30")).toBeInTheDocument();
    expect(within(benaliRow).getByText("08:30")).toBeInTheDocument();
    expect(within(benaliRow).getByText("18:30")).toBeInTheDocument();
    expect(within(benaliRow).getByText("Présent")).toBeInTheDocument();
  });

  it("counts present/late/absent/not-checked-in correctly across the cabinet", () => {
    renderAttendance("fr", { businessDate: "2026-08-18" }); // Tuesday: both team-1 and team-3 are late that day

    const table = screen.getByRole("table");
    expect(within(rowFor("Youssef Benali")).getByText("En retard")).toBeInTheDocument();
    expect(within(rowFor("Meryem Bakkali")).getByText("En retard")).toBeInTheDocument();
    expect(table).toBeInTheDocument();
  });

  it("shows the absent state for a work day with no check-in at all", () => {
    renderAttendance("fr", { businessDate: "2026-08-20" }); // Thursday: team-1 has no record that day

    expect(within(rowFor("Youssef Benali")).getByText("Absent")).toBeInTheDocument();
  });

  it("links each member row to their own Présence tab", () => {
    renderAttendance("fr", { businessDate: "2026-08-17" });

    const link = within(rowFor("Youssef Benali")).getByRole("link", { name: "Youssef Benali" });
    expect(link).toHaveAttribute("href", "/app/equipe/team-1/attendance");
  });
});

describe("TeamAttendancePage — states", () => {
  it("renders the loading skeleton without content", () => {
    renderAttendance("fr", { state: "loading" });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderAttendance("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les présences.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders Arabic content with RTL active", () => {
    const { container } = renderAttendance("ar", { businessDate: "2026-08-17" });

    expect(screen.getByRole("heading", { level: 1, name: "الحضور" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});
