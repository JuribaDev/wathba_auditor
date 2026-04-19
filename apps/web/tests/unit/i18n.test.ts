import { describe, expect, it } from "vitest";

import { getDirection, isLocale, swapLocaleInPath } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("identifies supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("maps direction per locale", () => {
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("ar")).toBe("rtl");
  });

  it("swaps locale segment while preserving the rest of the path", () => {
    expect(swapLocaleInPath("/en", "ar")).toBe("/ar");
    expect(swapLocaleInPath("/en/", "ar")).toBe("/ar");
    expect(swapLocaleInPath("/en/skills", "ar")).toBe("/ar/skills");
    expect(swapLocaleInPath("/en/skills/saudi-zatca-phase2", "ar")).toBe(
      "/ar/skills/saudi-zatca-phase2",
    );
    expect(swapLocaleInPath("/ar/generate", "en")).toBe("/en/generate");
  });

  it("falls back when the pathname has no locale prefix", () => {
    expect(swapLocaleInPath("/", "ar")).toBe("/ar");
    expect(swapLocaleInPath("", "en")).toBe("/en");
    expect(swapLocaleInPath("/skills", "en")).toBe("/en/skills");
  });
});
