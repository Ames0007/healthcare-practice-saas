import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { ResetPasswordPage } from "./reset-password-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(locale: Locale) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <ResetPasswordPage />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("ResetPasswordPage", () => {
  it("renders both password fields and the submit action", () => {
    renderPage("fr");
    expect(screen.getByRole("heading", { name: "Réinitialiser le mot de passe" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nouveau mot de passe/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirmer le mot de passe/)).toBeInTheDocument();
  });

  it("requires both fields", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));
    expect(screen.getAllByText("Ce champ est requis.")).toHaveLength(2);
  });

  it("rejects a mismatched confirmation", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText(/^Nouveau mot de passe/), { target: { value: "abc123" } });
    fireEvent.change(screen.getByLabelText(/^Confirmer le mot de passe/), { target: { value: "abc124" } });
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));
    expect(screen.getByText("Les mots de passe ne correspondent pas.")).toBeInTheDocument();
  });

  it("shows the success state when both fields match, without claiming real server persistence", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText(/^Nouveau mot de passe/), { target: { value: "abc123" } });
    fireEvent.change(screen.getByLabelText(/^Confirmer le mot de passe/), { target: { value: "abc123" } });
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));

    expect(screen.getByText("Mot de passe mis à jour")).toBeInTheDocument();
    expect(screen.getByText(/prévisualisation du parcours/)).toBeInTheDocument();
  });

  it("each password field has its own independent show/hide toggle", () => {
    renderPage("fr");
    const toggles = screen.getAllByRole("button", { name: "Afficher le mot de passe" });
    expect(toggles).toHaveLength(2);

    fireEvent.click(toggles[0]);
    expect(screen.getByLabelText(/^Nouveau mot de passe/)).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/^Confirmer le mot de passe/)).toHaveAttribute("type", "password");
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { name: "إعادة تعيين كلمة المرور" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
