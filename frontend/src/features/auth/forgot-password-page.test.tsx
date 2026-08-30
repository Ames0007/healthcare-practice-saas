import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { ForgotPasswordPage } from "./forgot-password-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(locale: Locale) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <ForgotPasswordPage />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("ForgotPasswordPage", () => {
  it("renders the email field and submit action", () => {
    renderPage("fr");
    expect(screen.getByRole("heading", { name: "Mot de passe oublié" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
  });

  it("requires an email", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));
    expect(screen.getByText("Ce champ est requis.")).toBeInTheDocument();
  });

  it("rejects an invalid email format", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));
    expect(screen.getByText("Adresse email invalide.")).toBeInTheDocument();
  });

  it("shows the generic success state for a well-formed email, real or not — never discloses account existence", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "personne-inconnue@cabinet.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));

    expect(screen.getByText("Si un compte existe pour cette adresse, des instructions de réinitialisation seront envoyées.")).toBeInTheDocument();
    expect(screen.queryByText(/n'existe pas/)).not.toBeInTheDocument();
  });

  it("links back to login", () => {
    renderPage("fr");
    expect(screen.getByRole("link", { name: "Retour à la connexion" })).toHaveAttribute("href", "/auth");
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { name: "نسيت كلمة المرور" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
