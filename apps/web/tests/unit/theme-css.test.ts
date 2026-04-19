import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { PRIMARY_SWATCHES, THEMES } from "@/lib/document-state";

const cssUrl = new URL("../../app/globals.css", import.meta.url);
const css = readFileSync(fileURLToPath(cssUrl), "utf8");

describe("theme CSS variants", () => {
  it("declares a light-theme rule for every non-default primary swatch", () => {
    for (const swatch of PRIMARY_SWATCHES) {
      if (swatch === "default") continue;
      // Light (no explicit data-theme qualifier) variant.
      const selector = `[data-primary="${swatch}"]`;
      expect(css, `CSS must include ${selector}`).toContain(selector);
    }
  });

  it("declares a dark-theme rule for every non-default primary swatch", () => {
    for (const swatch of PRIMARY_SWATCHES) {
      if (swatch === "default") continue;
      const selector = `[data-theme="dark"][data-primary="${swatch}"]`;
      expect(css, `CSS must include ${selector}`).toContain(selector);
    }
  });

  it("remaps the primary, primary-hover, primary-soft, and ring tokens for each variant", () => {
    // A swatch variant must shift the same four tokens so that buttons, focus
    // rings, and soft backgrounds all respond coherently. Use `ink` as the
    // canonical smoke-test case — PRIMARY_SWATCHES covers the rest at the
    // declaration-level via the assertions above.
    const inkLight = css.match(
      /\[data-primary="ink"\]\s*\{([^}]*)\}/,
    )?.[1];
    const inkDark = css.match(
      /\[data-theme="dark"\]\[data-primary="ink"\]\s*\{([^}]*)\}/,
    )?.[1];
    expect(inkLight, "ink light variant missing").toBeTruthy();
    expect(inkDark, "ink dark variant missing").toBeTruthy();
    for (const token of ["--primary:", "--primary-hover:", "--primary-soft:", "--ring:"]) {
      expect(inkLight!).toContain(token);
      expect(inkDark!).toContain(token);
    }
  });

  it("keeps a deliberate dark counterpart for base tokens rather than color-inverting", () => {
    // US-008 / US-010: the dark theme is a warm counterpart. This test guards
    // the root-level dark block from regressing to generic inversions.
    expect(THEMES).toContain("dark");
    expect(css).toMatch(/\[data-theme="dark"\]\s*\{[^}]*--background:\s*#1a1410/i);
  });
});
