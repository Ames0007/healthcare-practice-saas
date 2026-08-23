import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { LOCALE_DIRECTION } from "@/i18n/config";
import { getServerLocale } from "@/i18n/get-locale";
import { LocaleProvider } from "@/i18n/locale-provider";
import "./globals.css";

const latinFont = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Healthcare Practice Management SaaS",
  description:
    "Moroccan bilingual FR/AR healthcare practice management platform — frontend foundation.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      dir={LOCALE_DIRECTION[locale]}
      className={`${latinFont.variable} ${arabicFont.variable}`}
    >
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
