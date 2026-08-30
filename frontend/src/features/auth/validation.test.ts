import { describe, expect, it } from "vitest";
import { validateForgotPasswordForm, validateLoginForm, validateResetPasswordForm } from "./validation";

const MESSAGES = { required: "Champ requis.", invalidEmail: "Email invalide.", mismatch: "Les mots de passe ne correspondent pas." };

describe("validateLoginForm", () => {
  it("requires email and password", () => {
    const errors = validateLoginForm({ email: "", password: "", rememberMe: false }, MESSAGES);
    expect(errors.email).toBe(MESSAGES.required);
    expect(errors.password).toBe(MESSAGES.required);
  });

  it("rejects an invalid email format", () => {
    const errors = validateLoginForm({ email: "not-an-email", password: "x", rememberMe: false }, MESSAGES);
    expect(errors.email).toBe(MESSAGES.invalidEmail);
  });

  it("passes with a valid email and any non-empty password — no password-policy invention (task §7)", () => {
    const errors = validateLoginForm({ email: "a@b.com", password: "x", rememberMe: false }, MESSAGES);
    expect(errors).toEqual({});
  });

  it("rememberMe never affects validation outcome", () => {
    const a = validateLoginForm({ email: "a@b.com", password: "x", rememberMe: true }, MESSAGES);
    const b = validateLoginForm({ email: "a@b.com", password: "x", rememberMe: false }, MESSAGES);
    expect(a).toEqual(b);
  });
});

describe("validateForgotPasswordForm", () => {
  it("requires email", () => {
    expect(validateForgotPasswordForm({ email: "" }, MESSAGES).email).toBe(MESSAGES.required);
  });

  it("rejects an invalid email format", () => {
    expect(validateForgotPasswordForm({ email: "nope" }, MESSAGES).email).toBe(MESSAGES.invalidEmail);
  });

  it("passes with a valid email", () => {
    expect(validateForgotPasswordForm({ email: "a@b.com" }, MESSAGES)).toEqual({});
  });
});

describe("validateResetPasswordForm", () => {
  it("requires both fields", () => {
    const errors = validateResetPasswordForm({ password: "", confirmPassword: "" }, MESSAGES);
    expect(errors.password).toBe(MESSAGES.required);
    expect(errors.confirmPassword).toBe(MESSAGES.required);
  });

  it("rejects a mismatched confirmation", () => {
    const errors = validateResetPasswordForm({ password: "abc123", confirmPassword: "abc124" }, MESSAGES);
    expect(errors.confirmPassword).toBe(MESSAGES.mismatch);
  });

  it("passes when both fields match — no password-policy invention (task §10)", () => {
    expect(validateResetPasswordForm({ password: "abc123", confirmPassword: "abc123" }, MESSAGES)).toEqual({});
  });
});
