"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { PasswordInput } from "./components/password-input";
import { validateLoginForm } from "./validation";
import type { LoginFormValues } from "./types";

const INITIAL_VALUES: LoginFormValues = { email: "", password: "", rememberMe: false };

/**
 * Login (UI-013X Gate 1 §6, Spec #9 Screen 01). Real authentication does
 * not exist yet — no approved spec/wireframe defines a bounded "demo
 * credentials" mechanism (grep-confirmed across all 10 specs), and the
 * established repo precedent for "no real auth" prototype screens
 * (UI-013ABCDE's `/admin/*`, ADR-018) is "render without a gate," not "fake
 * a successful login." Per the task's own explicit fallback (§8), a valid
 * submission never sets a session/cookie/LocalStorage/JWT — it surfaces a
 * bounded Toast notice instead, reusing the exact "future-feature Toast"
 * convention already established for other not-yet-backed actions
 * (UI-FIX's dead-button audit). The form itself still fully validates —
 * it never "does nothing."
 */
export function LoginPage() {
  const { t } = useLocale();
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateLoginForm(values, {
      required: t("auth.login.requiredError"),
      invalidEmail: t("auth.login.invalidEmailError"),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setToastMessage(t("auth.login.pendingBackendNotice"));
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-sm font-semibold text-text-muted">{t("home.title")}</span>
        <h1 className="text-xl font-semibold text-text">{t("auth.login.heading")}</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t("auth.login.emailLabel")}
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          error={errors.email}
        />

        <PasswordInput
          label={t("auth.login.passwordLabel")}
          required
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
          error={errors.password}
          showLabel={t("auth.login.showPassword")}
          hideLabel={t("auth.login.hidePassword")}
        />

        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={values.rememberMe}
            onChange={(event) => setValues((current) => ({ ...current, rememberMe: event.target.checked }))}
            className="h-4 w-4 rounded border-border-strong"
          />
          {t("auth.login.rememberMe")}
        </label>

        <Button type="submit" className="w-full">
          {t("auth.login.submitAction")}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-3 text-sm">
        <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
          {t("auth.login.forgotPasswordLink")}
        </Link>
        <LanguageSwitcher />
      </div>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </Card>
  );
}
