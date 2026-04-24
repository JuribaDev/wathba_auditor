import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";
import { getDirection, locales } from "@/lib/i18n";

const ARABIC_CHAR_RANGE = /[\u0600-\u06FF]/;

// Leaves that are intentionally non-Arabic in the AR catalog:
// brand names, file paths, short technical tokens, and placeholders.
const ARABIC_EXEMPT_KEYS = new Set<string>([
  "Shell.github",
  "Landing.sampleFilename",
  "Questionnaire.review.versionPrefix",
  "Questionnaire.variables.selectPlaceholder",
  "Questionnaire.generate.zipFilename",
  "Questionnaire.generate.targets.claude",
  "Questionnaire.generate.targets.cursor",
  "Questionnaire.generate.targets.codex",
  "Questionnaire.generate.install.agents.claude.name",
  "Questionnaire.generate.install.agents.cursor.name",
  "Questionnaire.generate.install.agents.codex.name",
  "Questionnaire.generate.previewFilePlaceholder",
  "Questionnaire.tech.stack.options.nodejs.label",
  "Questionnaire.tech.stack.options.python.label",
  "Questionnaire.tech.stack.options.php.label",
  "Questionnaire.tech.stack.options.go.label",
  "Questionnaire.tech.agents.options.claude.label",
  "Questionnaire.tech.agents.options.claude.desc",
  "Questionnaire.tech.agents.options.cursor.label",
  "Questionnaire.tech.agents.options.cursor.desc",
  "Questionnaire.tech.agents.options.codex.desc",
  "SkillDetail.previewFilename",
  "Contribute.addTargetClaude",
  "Contribute.addTargetCursor",
  "Contribute.addTargetGeneric",
  "Contribute.noneNote",
  "ContributeViaAi.agentClaudeName",
  "ContributeViaAi.agentCursorName",
]);

// Leaves whose value is intentionally shared across locales. Currently none,
// but the set is kept as an extension point for future bilingual showcases.
const SHARED_VALUE_KEYS = new Set<string>();

type Catalog = Record<string, unknown>;

function collectLeaves(
  obj: unknown,
  prefix = "",
  out: Array<[string, string]> = [],
): Array<[string, string]> {
  if (typeof obj === "string") {
    out.push([prefix, obj]);
    return out;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Catalog)) {
      collectLeaves(v, prefix ? `${prefix}.${k}` : k, out);
    }
  }
  return out;
}

function walkSourceFiles(
  dir: string,
  exts = [".tsx", ".ts"],
  out: string[] = [],
): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".next")) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkSourceFiles(full, exts, out);
    } else if (exts.some((e) => full.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

describe("bilingual and RTL parity (US-046)", () => {
  it("getDirection maps each locale to the correct text direction", () => {
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("ar")).toBe("rtl");
    for (const locale of locales) {
      expect(["ltr", "rtl"]).toContain(getDirection(locale));
    }
  });

  it("every Arabic message leaf contains Arabic characters", () => {
    const arLeaves = collectLeaves(arMessages);
    const offenders: string[] = [];
    for (const [keyPath, value] of arLeaves) {
      if (ARABIC_EXEMPT_KEYS.has(keyPath)) continue;
      if (!ARABIC_CHAR_RANGE.test(value)) {
        offenders.push(`${keyPath} = ${JSON.stringify(value)}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("AR leaves differ from their EN counterparts for translatable keys", () => {
    const enLeaves = new Map(collectLeaves(enMessages));
    const arLeaves = collectLeaves(arMessages);
    const duplicates: string[] = [];
    for (const [keyPath, arValue] of arLeaves) {
      if (ARABIC_EXEMPT_KEYS.has(keyPath)) continue;
      if (SHARED_VALUE_KEYS.has(keyPath)) continue;
      const enValue = enLeaves.get(keyPath);
      if (enValue !== undefined && enValue === arValue) {
        duplicates.push(`${keyPath} = ${JSON.stringify(arValue)}`);
      }
    }
    expect(duplicates, duplicates.join("\n")).toEqual([]);
  });

  it("all core product screen namespaces exist in both locales", () => {
    const requiredScreens = [
      "Shell",
      "Landing",
      "Skills",
      "SkillDetail",
      "Questionnaire",
      "Generate",
      "Migrate",
    ];
    for (const ns of requiredScreens) {
      expect(
        (enMessages as Catalog)[ns],
        `en missing namespace ${ns}`,
      ).toBeTypeOf("object");
      expect(
        (arMessages as Catalog)[ns],
        `ar missing namespace ${ns}`,
      ).toBeTypeOf("object");
    }
  });

  it("app and component source code uses RTL-safe logical Tailwind classes", () => {
    const webRoot = path.resolve(__dirname, "..", "..");
    const dirs = [path.join(webRoot, "app"), path.join(webRoot, "components")];
    const files = dirs.flatMap((d) => walkSourceFiles(d));

    // Matches physical (LTR-baked) Tailwind classes that break in RTL.
    // We deliberately allow `text-left` / `text-right` inside elements that
    // also declare `dir="ltr"` (e.g. forced-LTR code previews).
    const PHYSICAL_CLASS = /\b(ml-\d|mr-\d|pl-\d|pr-\d|left-\d|right-\d)/g;
    const TEXT_ALIGN = /\btext-(left|right)\b/g;

    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      const physMatches = src.match(PHYSICAL_CLASS);
      if (physMatches) {
        offenders.push(`${path.relative(webRoot, file)}: ${physMatches.join(", ")}`);
      }
      // Only flag text-left/text-right if the file does not also pin dir="ltr"
      // on the same element (single-file heuristic is sufficient here).
      const alignMatches = src.match(TEXT_ALIGN);
      if (alignMatches && !/dir=["']ltr["']/.test(src)) {
        offenders.push(
          `${path.relative(webRoot, file)}: ${alignMatches.join(", ")} (no dir="ltr" guard)`,
        );
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });

});
