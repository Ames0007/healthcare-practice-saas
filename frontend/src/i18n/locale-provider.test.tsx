import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider } from "./locale-provider";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { useLocale } from "./locale-provider";

function Probe() {
  const { t } = useLocale();
  return <p>{t("nav.aujourdhui")}</p>;
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("LocaleProvider / language switch", () => {
  it("renders French translations and ltr direction by default", () => {
    render(
      <LocaleProvider initialLocale="fr">
        <Probe />
        <LanguageSwitcher />
      </LocaleProvider>,
    );

    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
  });

  it("switches French -> Arabic and updates document lang/dir to rtl", () => {
    render(
      <LocaleProvider initialLocale="fr">
        <Probe />
        <LanguageSwitcher />
      </LocaleProvider>,
    );

    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "العربية" }));

    expect(screen.getByText("اليوم")).toBeInTheDocument();
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
  });
});
