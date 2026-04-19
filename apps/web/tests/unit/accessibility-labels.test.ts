import { describe, it, expect } from "vitest";

import enMessages from "../../messages/en.json";
import arMessages from "../../messages/ar.json";

describe("accessibility-critical message keys", () => {
  const locales = { en: enMessages, ar: arMessages } as const;
  const requiredShellKeys = [
    "skipToContent",
    "localeSwitchLabel",
    "localeEnglish",
    "localeArabic",
    "themeGroupLabel",
    "themeLight",
    "themeDark",
    "primaryGroupLabel",
    "primaryDefault",
    "primaryInk",
    "primaryOlive",
    "primarySlate",
  ] as const;

  it.each(Object.entries(locales))(
    "%s Shell has all a11y navigation labels",
    (_name, messages) => {
      const shell = (messages as unknown as { Shell: Record<string, string> })
        .Shell;
      for (const key of requiredShellKeys) {
        const value = shell[key];
        expect(value, `Shell.${key}`).toBeTypeOf("string");
        expect(value.length, `Shell.${key} is non-empty`).toBeGreaterThan(0);
      }
    },
  );

  it.each(Object.entries(locales))(
    "%s Questionnaire has validationBlocked announcement",
    (_name, messages) => {
      const questionnaire = (
        messages as unknown as {
          Questionnaire: Record<string, unknown>;
        }
      ).Questionnaire;
      const value = questionnaire.validationBlocked;
      expect(value).toBeTypeOf("string");
      expect((value as string).length).toBeGreaterThan(0);
    },
  );
});
