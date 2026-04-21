import { describe, expect, it } from "vitest";

import type { GeneratedSkill } from "@/lib/skills/generated";
import { resolveSkillSummary } from "@/lib/skills/summary";

function buildSkill(overrides: Partial<GeneratedSkill> = {}): GeneratedSkill {
  return {
    id: "test-skill",
    name: { en: "Test", ar: "اختبار" },
    slug: "test",
    version: "0.1.0",
    category: "architecture",
    region: null,
    targets: ["claude-code"],
    status: "draft",
    lastVerified: "2026-01-01",
    maintainers: [],
    sources: [],
    disclaimer: false,
    variables: [],
    triggers: [],
    body: "# Heading\n\nBody paragraph.\n",
    directory: "architecture/test",
    references: [],
    scripts: [],
    files: [],
    previousIds: [],
    lifecycle: "active",
    replacementId: null,
    sunsetDate: null,
    lifecycleNote: null,
    ...overrides,
  };
}

describe("resolveSkillSummary", () => {
  it("prefers the localized summary for the active locale", () => {
    const skill = buildSkill({
      summary: { en: "English summary", ar: "ملخص عربي" },
    });

    expect(resolveSkillSummary(skill, "en")).toBe("English summary");
    expect(resolveSkillSummary(skill, "ar")).toBe("ملخص عربي");
  });

  it("falls back to the first non-heading body line when summary is missing", () => {
    const skill = buildSkill({
      summary: undefined,
      body: "# Heading\n\nFirst paragraph.\n\nSecond paragraph.\n",
    });

    expect(resolveSkillSummary(skill, "en")).toBe("First paragraph.");
  });

  it("falls back when the localized summary is an empty string", () => {
    const skill = buildSkill({
      summary: { en: "", ar: "ملخص عربي" },
      body: "# Heading\n\nEnglish body line.\n",
    });

    expect(resolveSkillSummary(skill, "en")).toBe("English body line.");
    expect(resolveSkillSummary(skill, "ar")).toBe("ملخص عربي");
  });

  it("returns an empty string when nothing is available", () => {
    const skill = buildSkill({
      summary: undefined,
      body: "# Only heading\n",
    });

    expect(resolveSkillSummary(skill, "en")).toBe("");
  });
});
