import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { LoginPage } from "./login-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(locale: Locale) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <LoginPage />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("LoginPage", () => {
  it("renders email/password fields and the submit action", () => {
    renderPage("fr");
    expect(screen.getByRole("heading", { name: "Connexion à votre espace" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de passe/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  it("shows required errors for empty email/password on submit", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(screen.getAllByText("Ce champ est requis.")).toHaveLength(2);
  });

  it("rejects an invalid email format", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText(/^Mot de passe/), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(screen.getByText("Adresse email invalide.")).toBeInTheDocument();
  });

  it("password is masked by default and the toggle reveals it accessibly", () => {
    renderPage("fr");
    const passwordField = screen.getByLabelText(/^Mot de passe/) as HTMLInputElement;
    expect(passwordField).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(passwordField).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Masquer le mot de passe" })).toBeInTheDocument();
  });

  it("a valid submission never sets any storage and only shows a bounded pending-backend notice", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "docteur@cabinet.test" } });
    fireEvent.change(screen.getByLabelText(/^Mot de passe/), { target: { value: "hunter2" } });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(screen.getByText("L'authentification réelle sera disponible après l'intégration du serveur.")).toBeInTheDocument();
    expect(window.localStorage.length).toBe(0);
    expect(document.cookie).toBe("");
  });

  it("links to forgot password", () => {
    renderPage("fr");
    expect(screen.getByRole("link", { name: "Mot de passe oublié ?" })).toHaveAttribute("href", "/auth/forgot-password");
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { name: "تسجيل الدخول إلى مساحتك" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
