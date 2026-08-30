import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { OnboardingWizard } from "./onboarding-wizard";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderWizard(locale: Locale) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <OnboardingWizard />
      </DirRoot>
    </LocaleProvider>,
  );
}

function fillCabinetStep() {
  fireEvent.change(screen.getByLabelText(/^Nom du cabinet/), { target: { value: "Cabinet Test" } });
  fireEvent.change(screen.getByLabelText(/^Téléphone/), { target: { value: "0522334455" } });
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("OnboardingWizard", () => {
  it("starts on the Cabinet step with progress 'Étape 1 sur 6'", () => {
    renderWizard("fr");
    expect(screen.getByText("Étape 1 sur 6")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Configuration du cabinet" })).toBeInTheDocument();
  });

  it("blocks continuing from Cabinet without a required field", () => {
    renderWizard("fr");
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getAllByText("Ce champ est obligatoire.").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Configuration du cabinet" })).toBeInTheDocument();
  });

  it("advances to Horaires once Cabinet is valid", () => {
    renderWizard("fr");
    fillCabinetStep();
    expect(screen.getByRole("heading", { name: "Vos horaires" })).toBeInTheDocument();
    expect(screen.getByText("Étape 2 sur 6")).toBeInTheDocument();
  });

  it("every weekday starts closed — a brand-new cabinet has no invented default schedule", () => {
    renderWizard("fr");
    fillCabinetStep();
    expect(screen.getAllByText("Fermé").length).toBe(7);
  });

  it("rejects an interval where end is before start, using the same validation Paramètres itself uses", () => {
    renderWizard("fr");
    fillCabinetStep();

    const mondayRow = screen.getByText("Lundi").closest("div") as HTMLElement;
    fireEvent.click(within(mondayRow).getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText("Ouverture"), { target: { value: "10:00" } });
    fireEvent.change(screen.getByLabelText("Fermeture"), { target: { value: "09:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));

    expect(screen.getByRole("heading", { name: "Vos horaires" })).toBeInTheDocument();
  });

  it("accepts a valid interval and advances to Services", () => {
    renderWizard("fr");
    fillCabinetStep();

    const mondayRow = screen.getByText("Lundi").closest("div") as HTMLElement;
    fireEvent.click(within(mondayRow).getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText("Ouverture"), { target: { value: "08:30" } });
    fireEvent.change(screen.getByLabelText("Fermeture"), { target: { value: "18:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));

    expect(screen.getByRole("heading", { name: "Vos services et tarifs" })).toBeInTheDocument();
  });

  it("Services step allows continuing with zero services — no invented minimum-service requirement", () => {
    renderWizard("fr");
    fillCabinetStep();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // hours, all-closed default
    expect(screen.getByText("Aucun service ajouté pour le moment")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getByRole("heading", { name: "Votre équipe" })).toBeInTheDocument();
  });

  it("adding a service via the reused ServiceFormDialog shows it in the reused ServiceTable", () => {
    renderWizard("fr");
    fillCabinetStep();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // hours

    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un service" }));
    fireEvent.change(screen.getByLabelText(/^Nom/), { target: { value: "Consultation" } });
    fireEvent.change(screen.getByLabelText(/^Durée/), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText(/^Prix/), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Consultation")).toBeInTheDocument();
  });

  it("Team step is optional — continuing with zero members works, and adding one requires first/last name", () => {
    renderWizard("fr");
    fillCabinetStep();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // hours
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // services

    expect(screen.getByText("Aucun membre ajouté — vous pourrez en ajouter depuis Équipe à tout moment.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ajouter un membre" }));
    expect(screen.getAllByText("Ce champ est requis.").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/^Prénom/), { target: { value: "Amal" } });
    fireEvent.change(screen.getByLabelText(/^Nom/), { target: { value: "Idrissi" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter un membre" }));
    expect(screen.getByText("Amal Idrissi")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getByRole("heading", { name: "Vos préférences" })).toBeInTheDocument();
  });

  it("reaches Review with a valid default duration, and Review lists every section", () => {
    renderWizard("fr");
    fillCabinetStep();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // hours
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // services
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // team
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // preferences

    expect(screen.getByRole("heading", { name: "Récapitulatif" })).toBeInTheDocument();
    expect(screen.getByText("Cabinet Test")).toBeInTheDocument();
    expect(screen.getByText("Aucun service ajouté")).toBeInTheDocument();
    expect(screen.getByText("Aucun membre ajouté")).toBeInTheDocument();
  });

  it("going back from Horaires to Cabinet preserves the already-entered values in memory", () => {
    renderWizard("fr");
    fillCabinetStep();
    fireEvent.click(screen.getByRole("button", { name: "Retour" }));
    expect(screen.getByDisplayValue("Cabinet Test")).toBeInTheDocument();
  });

  it("Terminer la configuration reaches the completion screen, which never claims real server persistence", () => {
    renderWizard("fr");
    fillCabinetStep();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // hours
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // services
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // team
    fireEvent.click(screen.getByRole("button", { name: "Continuer" })); // preferences
    fireEvent.click(screen.getByRole("button", { name: "Terminer la configuration" }));

    expect(screen.getByRole("heading", { name: "Votre espace est prêt" })).toBeInTheDocument();
    expect(screen.getByText(/votre cabinet sera réellement créé lorsque l'intégration serveur sera active/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Découvrir mon espace (aperçu)" })).toHaveAttribute("href", "/app");
  });

  it("never touches localStorage/cookies at any point in the flow", () => {
    renderWizard("fr");
    fillCabinetStep();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Terminer la configuration" }));

    expect(window.localStorage.length).toBe(0);
    expect(document.cookie).toBe("");
  });

  it("progress is hidden once the flow reaches completion", () => {
    renderWizard("fr");
    fillCabinetStep();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Terminer la configuration" }));

    expect(screen.queryByText(/Étape \d sur 6/)).not.toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderWizard("ar");
    expect(screen.getByRole("heading", { name: "إعداد العيادة" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
