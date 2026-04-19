import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  PRIMARY_SWATCHES,
  THEMES,
  type PrimarySwatch,
} from "@/lib/document-state";
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

const sourceUrl = new URL(
  "../../components/theme-controls.tsx",
  import.meta.url,
);
const source = readFileSync(fileURLToPath(sourceUrl), "utf8");

const EXPECTED_SWATCH_HEX: Record<PrimarySwatch, string> = {
  default: "#8F4B24",
  ink: "#2E4A6B",
  olive: "#5C6A36",
  slate: "#3A3A3A",
};

describe("theme-controls source", () => {
  it("declares a preview color for every canonical primary swatch", () => {
    for (const swatch of PRIMARY_SWATCHES) {
      const expected = EXPECTED_SWATCH_HEX[swatch];
      expect(
        source,
        `theme-controls must map swatch '${swatch}' to ${expected}`,
      ).toContain(`${swatch}: "${expected}"`);
    }
  });

  it("iterates the canonical theme and swatch lists rather than hard-coded strings", () => {
    // The component should render THEMES.map / PRIMARY_SWATCHES.map so that
    // adding a new theme or swatch in `@/lib/document-state` fans out to the
    // controls without a parallel edit here.
    expect(source).toContain("THEMES.map");
    expect(source).toContain("PRIMARY_SWATCHES.map");
  });

  it("does not hard-code theme or swatch identifiers in JSX attributes", () => {
    // Guard against a future refactor replacing the map with a static list.
    const badThemeLiteral = /key=['"]light['"]/;
    const badPrimaryLiteral = /key=['"]ink['"]/;
    expect(source).not.toMatch(badThemeLiteral);
    expect(source).not.toMatch(badPrimaryLiteral);
  });

  it("exposes reusable control pieces for the future edit-mode tweaks panel", () => {
    // US-010 AC#5: theme controls can be reused by the edit-mode tweaks panel.
    expect(source).toMatch(/export function ThemeToggle\b/);
    expect(source).toMatch(/export function PrimarySwatchPicker\b/);
    expect(source).toMatch(/export function ThemeControls\b/);
  });
});

describe("theme-controls message catalogs", () => {
  type ShellCatalog = {
    themeGroupLabel: string;
    themeLight: string;
    themeDark: string;
    primaryGroupLabel: string;
    primaryDefault: string;
    primaryInk: string;
    primaryOlive: string;
    primarySlate: string;
  };

  function shell(msgs: unknown): ShellCatalog {
    return (msgs as { Shell: ShellCatalog }).Shell;
  }

  it("covers every theme with a distinct localized label in both locales", () => {
    for (const locale of [enMessages, arMessages]) {
      const s = shell(locale);
      const byTheme = { light: s.themeLight, dark: s.themeDark } as const;
      for (const theme of THEMES) {
        expect(byTheme[theme].length).toBeGreaterThan(0);
      }
      expect(s.themeLight).not.toBe(s.themeDark);
    }
  });

  it("covers every primary swatch with a distinct localized label in both locales", () => {
    for (const locale of [enMessages, arMessages]) {
      const s = shell(locale);
      const bySwatch: Record<PrimarySwatch, string> = {
        default: s.primaryDefault,
        ink: s.primaryInk,
        olive: s.primaryOlive,
        slate: s.primarySlate,
      };
      const labels = new Set<string>();
      for (const swatch of PRIMARY_SWATCHES) {
        expect(bySwatch[swatch].length).toBeGreaterThan(0);
        labels.add(bySwatch[swatch]);
      }
      expect(labels.size).toBe(PRIMARY_SWATCHES.length);
    }
  });
});
