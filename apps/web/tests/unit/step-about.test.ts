import { describe, expect, it } from "vitest";

import { isKsaMarket } from "@/components/questionnaire/step-about";

describe("isKsaMarket", () => {
  it("returns true for ksa", () => {
    expect(isKsaMarket("ksa")).toBe(true);
  });

  it("returns true for gcc", () => {
    expect(isKsaMarket("gcc")).toBe(true);
  });

  it("returns false for global", () => {
    expect(isKsaMarket("global")).toBe(false);
  });

  it("returns false for other", () => {
    expect(isKsaMarket("other")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isKsaMarket(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isKsaMarket(null)).toBe(false);
  });
});
