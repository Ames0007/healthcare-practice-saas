"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateForgotPasswordForm } from "./validation";
import type { ForgotPasswordFormValues } from "./types";

const INITIAL_VALUES: ForgotPasswordFormValues = { email: "" };

/**
 * Forgot password (UI-013X Gate 1 §9, Spec #2 §5.2). No email is actually
 * sent — the success state is deliberately generic regardless of whether
 * the address matches anything, so this screen never discloses account
 * existence (task's own explicit instruction, mirrors CLAUDE.md §17's
 * "Do not expose whether the submitted patient already exists" applied
 * here to accounts instead of patients).
 */
export function ForgotPasswordPage() {
  const { t } = useLocale();
  const [values, setValues] = useState<ForgotPasswordFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateForgotPasswordForm(values, {
      required: t("auth.forgotPassword.requiredError"),
      invalidEmail: t("auth.forgotPassword.invalidEmailError"),
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
        <h1 className="text-xl font-semibold text-text">{t("auth.forgotPassword.successHeading")}</h1>
        <p role="status" className="text-sm text-text-secondary">
          {t("auth.forgotPassword.successMessage")}
        </p>
        <Link href="/auth" className="text-sm font-medium text-primary hover:underline">
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold text-text">{t("auth.forgotPassword.heading")}</h1>
        <p className="text-sm text-text-secondary">{t("auth.forgotPassword.description")}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t("auth.forgotPassword.emailLabel")}
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={(event) => setValues({ email: event.target.value })}
          error={errors.email}
        />

        <Button type="submit" className="w-full">
          {t("auth.forgotPassword.submitAction")}
        </Button>
      </form>

      <Link href="/auth" className="text-center text-sm font-medium text-primary hover:underline">
        {t("auth.forgotPassword.backToLogin")}
      </Link>
    </Card>
  );
}
