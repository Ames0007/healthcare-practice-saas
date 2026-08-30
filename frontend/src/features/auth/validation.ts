import { isValidEmail } from "@/features/patients/patient-form-validation";
import type { ForgotPasswordFormValues, LoginFormValues, ResetPasswordFormValues } from "./types";

/**
 * Email/required-field validation only (task §7: "Do NOT invent production
 * password-policy enforcement at login" — no minimum-length/complexity
 * rule for the password field). Reuses the existing `isValidEmail`
 * (`features/patients/patient-form-validation.ts`) rather than a second
 * email pattern.
 */
export function validateLoginForm(
  values: LoginFormValues,
  messages: { required: string; invalidEmail: string },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.email.trim()) {
    errors.email = messages.required;
  } else if (!isValidEmail(values.email)) {
    errors.email = messages.invalidEmail;
  }

  if (!values.password) errors.password = messages.required;

  return errors;
}

export function validateForgotPasswordForm(
  values: ForgotPasswordFormValues,
  messages: { required: string; invalidEmail: string },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.email.trim()) {
    errors.email = messages.required;
  } else if (!isValidEmail(values.email)) {
    errors.email = messages.invalidEmail;
  }

  return errors;
}

/**
 * Required + must-match only (task §10: "No real token verification. Do
 * not invent a fake security token system" — likewise no password-policy
 * invention here).
 */
export function validateResetPasswordForm(
  values: ResetPasswordFormValues,
  messages: { required: string; mismatch: string },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.password) errors.password = messages.required;
  if (!values.confirmPassword) {
    errors.confirmPassword = messages.required;
  } else if (values.password && values.password !== values.confirmPassword) {
    errors.confirmPassword = messages.mismatch;
  }

  return errors;
}
