"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./components/password-input";
import { validateResetPasswordForm } from "./validation";
import type { ResetPasswordFormValues } from "./types";

const INITIAL_VALUES: ResetPasswordFormValues = { password: "", confirmPassword: "" };

/**
 * Reset password (UI-013X Gate 1 §10, Spec #2 §5.2's field list — no
 * dedicated wireframe exists for this screen, grep-confirmed). No real
 * token verification exists (task's own explicit instruction): this route
 * always renders the form regardless of any `token` query string a real
 * emailed link would carry — there is no backend to validate it against,
 * and inventing a fake verification result would misrepresent this
 * prototype's actual guarantees.
 */
export function ResetPasswordPage() {
  const { t } = useLocale();
  const [values, setValues] = useState<ResetPasswordFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateResetPasswordForm(values, {
      required: t("auth.resetPassword.requiredError"),
      mismatch: t("auth.resetPassword.mismatchError"),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold text-text">{t("auth.resetPassword.successHeading")}</h1>
        <p role="status" className="text-sm text-text-secondary">
          {t("auth.resetPassword.successMessage")}
        </p>
        <Link href="/auth" className="text-sm font-medium text-primary hover:underline">
          {t("auth.resetPassword.backToLogin")}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold text-text">{t("auth.resetPassword.heading")}</h1>
        <p className="text-sm text-text-secondary">{t("auth.resetPassword.description")}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PasswordInput
          label={t("auth.resetPassword.passwordLabel")}
          required
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
          error={errors.password}
          showLabel={t("auth.login.showPassword")}
          hideLabel={t("auth.login.hidePassword")}
        />

        <PasswordInput
          label={t("auth.resetPassword.confirmPasswordLabel")}
          required
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))}
          error={errors.confirmPassword}
          showLabel={t("auth.login.showPassword")}
          hideLabel={t("auth.login.hidePassword")}
        />

        <Button type="submit" className="w-full">
          {t("auth.resetPassword.submitAction")}
        </Button>
      </form>
    </Card>
  );
}
