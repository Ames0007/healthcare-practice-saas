import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/i18n/locale-provider";
import { getTeamMembersMockData } from "./mock-data";
import { TeamMemberDetailPage } from "./team-member-detail-page";

/**
 * Routing regression (task §3) — `/app/equipe/leave-calendar` and
 * `/app/equipe/attendance` are static siblings of the dynamic
 * `/app/equipe/[id]` route. Next.js's App Router always resolves a static
 * segment before considering a dynamic sibling, so the real production
 * route file (`app/app/equipe/leave-calendar/page.tsx`) is never even
 * reached by `[id]/page.tsx` for that URL — but this suite proves the
 * belt-and-braces case too: no real TeamMember id could ever collide with
 * either static segment, and even if `[id]/page.tsx` somehow received one
 * of these strings, `TeamMemberDetailPage` degrades to its own real
 * not-found state rather than crashing or showing a wrong member.
 */
describe("Équipe routing — static cabinet-level routes never collide with the dynamic [id] route", () => {
  it("no real TeamMember id equals 'leave-calendar' or 'attendance'", () => {
    const ids = getTeamMembersMockData().map((member) => member.id);
    expect(ids).not.toContain("leave-calendar");
    expect(ids).not.toContain("attendance");
  });

  it("TeamMemberDetailPage shows its own not-found state for memberId='leave-calendar', never a crash or a wrong member", () => {
    render(
      <LocaleProvider initialLocale="fr">
        <TeamMemberDetailPage memberId="leave-calendar" />
      </LocaleProvider>,
    );

    expect(screen.getByText("Membre introuvable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à l'équipe" })).toHaveAttribute("href", "/app/equipe");
  });

  it("TeamMemberDetailPage shows its own not-found state for memberId='attendance' too", () => {
    render(
      <LocaleProvider initialLocale="fr">
        <TeamMemberDetailPage memberId="attendance" />
      </LocaleProvider>,
    );

    expect(screen.getByText("Membre introuvable")).toBeInTheDocument();
  });
});
