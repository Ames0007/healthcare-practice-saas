/**
 * Deterministic prototype referral code/link generation (UI-011ABC Gate 3,
 * Spec #9 Screen 50: code "AMAL8K2", link "app.ma/r/AMAL8K2"). Not
 * cryptographically random — a real backend generator (Spec #4 §29.1
 * `referral_codes.code UNIQUE`) is a future concern; this only needs to
 * be stable and presentable for the prototype. `app.ma` is the exact
 * domain the approved wireframe itself uses — never a real, live
 * production URL (task's own explicit "No real production domain").
 */
const CODE_SUFFIX = "7X2";

export function buildReferralCode(cabinetName: string): string {
  // NFD + stripping anything outside a-zA-Z removes accents in one pass
  // (a decomposed accent becomes its own non-letter code point, which the
  // a-zA-Z filter then discards along with spaces/punctuation).
  const letters = cabinetName
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 5);
  return `${letters || "CAB"}${CODE_SUFFIX}`;
}

export function buildReferralLink(code: string): string {
  return `app.ma/r/${code}`;
}
