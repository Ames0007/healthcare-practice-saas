import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

/**
 * Server-only: resolves the initial locale from the bootstrap cookie so the
 * root layout can render the correct lang/dir/dictionary on the first
 * response, avoiding a client-side language/direction flash.
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;

  return isLocale(value) ? value : DEFAULT_LOCALE;
}
