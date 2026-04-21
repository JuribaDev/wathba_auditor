import { describe, expect, it } from "vitest";

import {
  CONTRIBUTOR_TEMPLATES,
  DEFAULT_CONTRIBUTOR_DRAFT,
  SKILL_MD_OUTLINE,
  applyTemplate,
  deriveSkillId,
  previewSkillYaml,
  slugifyName,
  validateIsoDate,
  validateSlug,
  validateUrl,
} from "@/lib/contribute/prompt";

describe("slugifyName", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyName("ZATCA Phase 2")).toBe("zatca-phase-2");
  });
  it("strips punctuation and collapses separators", () => {
    expect(slugifyName("Auth / Boundary  Isolation!!")).toBe("auth-boundary-isolation");
  });
  it("returns empty for empty/whitespace", () => {
    expect(slugifyName("")).toBe("");
    expect(slugifyName("   ")).toBe("");
  });
});

describe("deriveSkillId", () => {
  it("joins group and slug", () => {
    expect(deriveSkillId("architecture", "ci-hygiene")).toBe("architecture-ci-hygiene");
  });
  it("returns slug alone when it already starts with the group", () => {
    expect(deriveSkillId("security", "security-secrets-baseline")).toBe(
      "security-secrets-baseline",
    );
  });
  it("returns slug alone when group is empty", () => {
    expect(deriveSkillId("", "sample")).toBe("sample");
  });
});

describe("validators", () => {
  it("validateSlug accepts kebab-case and rejects everything else", () => {
    expect(validateSlug("ci-hygiene")).toBeNull();
    expect(validateSlug("CI-Hygiene")).not.toBeNull();
    expect(validateSlug("ci_hygiene")).not.toBeNull();
    expect(validateSlug("")).not.toBeNull();
  });
  it("validateIsoDate rejects nonexistent calendar dates", () => {
    expect(validateIsoDate("2026-02-29")).not.toBeNull();
    expect(validateIsoDate("2026-02-28")).toBeNull();
    expect(validateIsoDate("2026/01/01")).not.toBeNull();
  });
  it("validateUrl requires an http(s) URL", () => {
    expect(validateUrl("https://example.test/")).toBeNull();
    expect(validateUrl("ftp://example.test")).not.toBeNull();
    expect(validateUrl("not-a-url")).not.toBeNull();
  });
});

describe("applyTemplate", () => {
  it("pre-fills group, category, region, disclaimer, status", () => {
    const saudi = CONTRIBUTOR_TEMPLATES.find((t) => t.id === "saudi-compliance")!;
    const applied = applyTemplate(saudi, { ...DEFAULT_CONTRIBUTOR_DRAFT });
    expect(applied.group).toBe("saudi");
    expect(applied.category).toBe("compliance");
    expect(applied.region).toBe("saudi-arabia");
    expect(applied.disclaimer).toBe(true);
  });
});

describe("SKILL_MD_OUTLINE", () => {
  it("includes the canonical activation and baseline sections", () => {
    expect(SKILL_MD_OUTLINE).toContain("## When this skill activates");
    expect(SKILL_MD_OUTLINE).toContain("## Baseline rules");
    expect(SKILL_MD_OUTLINE).toContain("## References");
  });
});

describe("previewSkillYaml", () => {
  it("renders an editable skill.yaml preview with escaped scalars", () => {
    const yaml = previewSkillYaml({
      ...DEFAULT_CONTRIBUTOR_DRAFT,
      action: "add",
      id: "architecture-ci-hygiene",
      slug: "ci-hygiene",
      group: "architecture",
      nameEn: "CI Hygiene: core",
      nameAr: "نظافة CI",
      summaryEn: "Lint, type, test.",
      summaryAr: "فحص.",
      category: "architecture",
    });
    expect(yaml).toContain('en: "CI Hygiene: core"');
    expect(yaml).toContain("slug: ci-hygiene");
    expect(yaml).toContain("id: architecture-ci-hygiene");
  });
});
