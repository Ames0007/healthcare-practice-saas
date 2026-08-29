import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { PublicBookingPage } from "./public-booking-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderBookingPage(initialLocale: Locale = "fr") {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PublicBookingPage />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

/**
 * Drives the wizard up to (and including) selecting the 08:30 slot on
 * 2026-08-25 for Dr. Benali / Consultation — a real Tuesday with no
 * calendar exception and no appointment fixture (unlike 2026-08-24, which
 * carries a real `modified_hours` exception, see
 * `cross-booking-integrity.test.ts`), so it cleanly exercises the golden
 * path without any secondary rule also being in play.
 */
function selectServicePractitionerAndSlot() {
  fireEvent.click(screen.getByRole("button", { name: /Consultation/ }));
  fireEvent.click(screen.getByRole("button", { name: /Dr\. Benali/ }));
  fireEvent.click(screen.getByRole("button", { name: "25" }));
  fireEvent.click(screen.getByRole("button", { name: "08:30" }));
}

function fillContactForm() {
  fireEvent.change(screen.getByLabelText(/^Prénom/), { target: { value: "Ahmed" } });
  fireEvent.change(screen.getByLabelText(/^Nom/), { target: { value: "El Mansouri" } });
  fireEvent.change(screen.getByLabelText(/^Téléphone/), { target: { value: "06 12 34 56 78" } });
}

describe("PublicBookingPage — shell (task's own critical acceptance tests 1-2)", () => {
  it("renders the real booking flow at /book, not the AppShell", () => {
    renderBookingPage();
    expect(screen.getByRole("heading", { level: 1, name: "Prendre rendez-vous" })).toBeInTheDocument();
    expect(screen.queryByText("Aujourd'hui")).not.toBeInTheDocument();
  });
});

describe("PublicBookingPage — service & practitioner selection (task §28-32)", () => {
  it("shows only active services (excludes the inactive 'Suivi')", () => {
    renderBookingPage();
    expect(screen.getByRole("button", { name: /Consultation/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Suivi/ })).not.toBeInTheDocument();
  });

  it("shows eligible practitioners after selecting a service, never Othmane Zouiten", () => {
    renderBookingPage();
    fireEvent.click(screen.getByRole("button", { name: /Consultation/ }));

    expect(screen.getByRole("button", { name: /Dr\. Benali/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dr\. Amal/ })).toBeInTheDocument();
    expect(screen.queryByText(/Zouiten/)).not.toBeInTheDocument();
  });
});

describe("PublicBookingPage — calendar & slots (task §33-40)", () => {
  it("marks the real weekly-closed Sunday (2026-08-23) as disabled with a safe reason, never color-only", () => {
    renderBookingPage();
    fireEvent.click(screen.getByRole("button", { name: /Consultation/ }));
    fireEvent.click(screen.getByRole("button", { name: /Dr\. Benali/ }));

    const sundayCell = screen.getByRole("button", { name: /^23 —/ });
    expect(sundayCell).toBeDisabled();
    expect(sundayCell).toHaveAccessibleName(/Cabinet fermé/);
  });

  it("selecting an available date reveals its real bookable slots", () => {
    renderBookingPage();
    fireEvent.click(screen.getByRole("button", { name: /Consultation/ }));
    fireEvent.click(screen.getByRole("button", { name: /Dr\. Benali/ }));
    fireEvent.click(screen.getByRole("button", { name: "25" }));

    expect(screen.getByRole("button", { name: "08:30" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "14:30" })).toBeInTheDocument();
  });

  it("the real modified-hours exception on 2026-08-24 restricts slots to its own afternoon-only window (task §60/§63)", () => {
    renderBookingPage();
    fireEvent.click(screen.getByRole("button", { name: /Consultation/ }));
    fireEvent.click(screen.getByRole("button", { name: /Dr\. Benali/ }));
    fireEvent.click(screen.getByRole("button", { name: "24" }));

    expect(screen.queryByRole("button", { name: "09:30" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "14:30" })).toBeInTheDocument();
  });

  it("changing the practitioner after picking a date invalidates the stale date/slot (task §40)", () => {
    renderBookingPage();
    selectServicePractitionerAndSlot();

    // Back to details -> back to date -> change practitioner.
    fireEvent.click(screen.getByRole("button", { name: "Retour" }));
    fireEvent.click(screen.getByRole("button", { name: "Changer de praticien" }));
    fireEvent.click(screen.getByRole("button", { name: /Dr\. Amal/ }));

    // Landed back on the date step with no slot pre-selected — the details step is not reachable directly.
    expect(screen.getByText("Sélectionnez une date pour voir les créneaux disponibles.")).toBeInTheDocument();
  });

  it("never discloses a practitioner's approved leave — Dr. Amal's real 2026-08-27 leave shows the same generic reason as any other unavailability", () => {
    renderBookingPage();
    fireEvent.click(screen.getByRole("button", { name: /Consultation/ }));
    fireEvent.click(screen.getByRole("button", { name: /Dr\. Amal/ }));

    const leaveCell = screen.getByRole("button", { name: /^27 —/ });
    expect(leaveCell).toHaveAccessibleName(/Indisponible/);
    expect(leaveCell).not.toHaveAccessibleName(/cong/i);
    expect(screen.queryByText(/cong/i)).not.toBeInTheDocument();
  });
});

describe("PublicBookingPage — patient details & review (task §41-47)", () => {
  it("requires first name, last name and a valid phone before continuing", () => {
    renderBookingPage();
    selectServicePractitionerAndSlot();

    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getAllByText("Ce champ est requis.").length).toBeGreaterThanOrEqual(3);
  });

  it("never renders a CIN or social-coverage field (task §42)", () => {
    renderBookingPage();
    selectServicePractitionerAndSlot();

    expect(screen.queryByLabelText(/CIN/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/AMO|couverture sociale/i)).not.toBeInTheDocument();
  });

  it("shows the exact selection on the review screen", () => {
    renderBookingPage();
    selectServicePractitionerAndSlot();
    fillContactForm();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));

    expect(screen.getByRole("heading", { name: "Vérifiez votre rendez-vous" })).toBeInTheDocument();
    expect(screen.getByText("Consultation")).toBeInTheDocument();
    expect(screen.getByText("Dr. Benali")).toBeInTheDocument();
    expect(screen.getByText("08:30")).toBeInTheDocument();
    expect(screen.getByText("400 MAD")).toBeInTheDocument();
    expect(screen.getByText(/Ahmed El Mansouri/)).toBeInTheDocument();
  });
});

describe("PublicBookingPage — submission & confirmation (task §48-55)", () => {
  it("confirms the booking with status wording matching REQUESTED, never claiming a confirmed appointment", () => {
    renderBookingPage();
    selectServicePractitionerAndSlot();
    fillContactForm();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer le rendez-vous" }));

    expect(screen.getByRole("heading", { name: "Demande envoyée" })).toBeInTheDocument();
    expect(screen.getByText("Le cabinet doit encore confirmer votre rendez-vous.")).toBeInTheDocument();
    expect(screen.queryByText(/rendez-vous est confirmé/i)).not.toBeInTheDocument();
    expect(screen.getByText(/DEM-20260825-001/)).toBeInTheDocument();
  });

  it("prevents an immediate second local booking of the same now-taken slot (task §51)", () => {
    renderBookingPage();
    selectServicePractitionerAndSlot();
    fillContactForm();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer le rendez-vous" }));

    fireEvent.click(screen.getByRole("button", { name: "Prendre un autre rendez-vous" }));
    fireEvent.click(screen.getByRole("button", { name: /Consultation/ }));
    fireEvent.click(screen.getByRole("button", { name: /Dr\. Benali/ }));
    fireEvent.click(screen.getByRole("button", { name: "25" }));

    expect(screen.queryByRole("button", { name: "08:30" })).not.toBeInTheDocument();
  });

  it("'Prendre un autre rendez-vous' resets the wizard to the service step", () => {
    renderBookingPage();
    selectServicePractitionerAndSlot();
    fillContactForm();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer le rendez-vous" }));
    fireEvent.click(screen.getByRole("button", { name: "Prendre un autre rendez-vous" }));

    expect(screen.getByRole("heading", { name: "Choisissez un service" })).toBeInTheDocument();
  });
});

describe("PublicBookingPage — Arabic / RTL (task §70-71)", () => {
  it("renders the hero and service step in Arabic under RTL", () => {
    renderBookingPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "حجز موعد" })).toBeInTheDocument();
    expect(document.querySelector('[dir="rtl"]')).not.toBeNull();
  });

  it("completes the same golden-path flow through to confirmation in Arabic", () => {
    renderBookingPage("ar");
    fireEvent.click(screen.getByRole("button", { name: /Consultation/ }));
    fireEvent.click(screen.getByRole("button", { name: /Dr\. Benali/ }));
    fireEvent.click(screen.getByRole("button", { name: "25" }));
    fireEvent.click(screen.getByRole("button", { name: "08:30" }));

    fireEvent.change(screen.getByLabelText(/^الاسم الشخصي/), { target: { value: "أحمد" } });
    fireEvent.change(screen.getByLabelText(/^الاسم العائلي/), { target: { value: "المنصوري" } });
    fireEvent.change(screen.getByLabelText(/^الهاتف/), { target: { value: "06 12 34 56 78" } });
    fireEvent.click(screen.getByRole("button", { name: "متابعة" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الموعد" }));

    expect(screen.getByRole("heading", { name: "تم إرسال الطلب" })).toBeInTheDocument();
  });
});
