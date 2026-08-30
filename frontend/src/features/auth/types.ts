/**
 * Authentication UX prototype (UI-013X Gate 1, Spec #2 §5). Frontend UX
 * only — no real identity verification, no session, no persisted
 * credentials anywhere (task's own explicit boundary: "Authentication UX
 * ≠ real authentication"). These types exist purely to drive local form
 * state; nothing here is ever sent to a backend or stored beyond the
 * current render.
 */
export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}
