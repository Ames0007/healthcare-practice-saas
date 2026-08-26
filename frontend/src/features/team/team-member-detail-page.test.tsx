import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { TeamMemberDetailPage } from "./team-member-detail-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/equipe/team-3",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderDetail(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof TeamMemberDetailPage> = { memberId: "team-3" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <TeamMemberDetailPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("TeamMemberDetailPage", () => {
  it("renders identity, role, employee number and status for a valid member (§31)", () => {
    renderDetail();

    expect(screen.getByRole("heading", { level: 1, name: "Meryem Bakkali" })).toBeInTheDocument();
    expect(screen.getByText("EMP-0003")).toBeInTheDocument();
    expect(screen.getAllByText("Réceptionniste").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Actif").length).toBeGreaterThan(0);
  });

  it("renders contact and employment info under INFORMATIONS (§31)", () => {
    renderDetail();

    expect(screen.getByText("06 22 33 44 55")).toBeInTheDocument();
    expect(screen.getByText("meryem@cabinet-exemple.test")).toBeInTheDocument();
    expect(screen.getByText("1 mars 2025")).toBeInTheDocument();
  });

  it("renders role and status again under TRAVAIL (§31)", () => {
    renderDetail();

    expect(screen.getAllByText("Réceptionniste").length).toBe(2);
    expect(screen.getAllByText("Actif").length).toBe(2);
  });

  it("shows the professional title next to the role for a practitioner", () => {
    renderDetail("fr", { memberId: "team-1" });

    expect(screen.getByText("Médecin")).toBeInTheDocument();
  });

  it("shows a not-provided fallback for a member without an optional field", () => {
    const members = [
      {
        id: "team-x",
        employeeNumber: "EMP-0099",
        firstName: "Sans",
        lastName: "Contact",
        role: "other" as const,
        status: "active" as const,
      },
    ];
    renderDetail("fr", { memberId: "team-x", members });

    expect(screen.getAllByText("Non renseigné").length).toBe(3);
  });

  it("shows the not-found state for an unknown member id", () => {
    renderDetail("fr", { memberId: "does-not-exist" });

    expect(screen.getByText("Membre introuvable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à l'équipe" })).toHaveAttribute("href", "/app/equipe");
  });

  it("renders the loading skeleton without member content", () => {
    renderDetail("fr", { memberId: "team-3", state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Meryem Bakkali")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderDetail("fr", { memberId: "team-3", state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les informations du membre.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders Arabic content with RTL active", () => {
    const { container } = renderDetail("ar");

    expect(screen.getByRole("heading", { level: 1, name: "Meryem Bakkali" })).toBeInTheDocument();
    expect(screen.getAllByText("موظف استقبال").length).toBeGreaterThan(0);
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

describe("TeamMemberDetailPage — bounded edit (UI-007A §9/§30-31)", () => {
  it("opens the edit form prefilled with the member's current values from the [Modifier] action", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(screen.getByRole("heading", { level: 2, name: "Modifier le membre" })).toBeInTheDocument();
    expect(screen.getByLabelText("Prénom *")).toHaveValue("Meryem");
    expect(screen.getByText("Numéro employé : EMP-0003")).toBeInTheDocument();
  });

  it("saves edits and reflects them immediately on this page", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "Bakkali-Test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Membre modifié.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Meryem Bakkali-Test" })).toBeInTheDocument();
  });

  it("cancelling the edit form does not change the member", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "ShouldNotSave" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Meryem Bakkali" })).toBeInTheDocument();
  });
});
