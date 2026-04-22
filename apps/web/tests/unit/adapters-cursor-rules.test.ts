import { describe, expect, it } from "vitest";

import {
  buildCursorRuleFrontmatter,
  buildCursorRuleMarkdown,
  renderCursorRulesFiles,
  renderCursorRulesPaths,
} from "@/lib/generate/adapters/cursor-rules";
import type { GeneratedSkill } from "@/lib/skills/generated";

function makeSkill(
  overrides: Partial<GeneratedSkill> & Pick<GeneratedSkill, "id" | "slug">,
): GeneratedSkill {
  const { id, slug, ...rest } = overrides;
  return {
    id,
    name: { en: id, ar: id },
    summary: { en: `${id} summary`, ar: `${id} ملخص` },
    slug,
    previousIds: [],
    lifecycle: "active",
    replacementId: null,
    sunsetDate: null,
    lifecycleNote: null,
    version: "0.1.0",
    category: "architecture",
    region: null,
    targets: ["cursor"],
    status: "draft",
    lastVerified: "2026-01-01",
    maintainers: [],
    sources: [],
    disclaimer: false,
    variables: [],
    triggers: [],
    body: "Body paragraph.",
    directory: slug,
    files: [],
    references: [],
    scripts: [],
    ...rest,
  };
}

describe("cursor-rules adapter", () => {
  it("emits a single .mdc file per skill under .cursor/rules/", () => {
    const skills = [
      makeSkill({ id: "a", slug: "alpha" }),
      makeSkill({ id: "b", slug: "bravo" }),
    ];
    const paths = renderCursorRulesPaths(skills);
    expect(paths).toEqual([".cursor/rules/alpha.mdc", ".cursor/rules/bravo.mdc"]);
  });

  it("returns no files when no skills are active", () => {
    expect(renderCursorRulesFiles([])).toEqual([]);
    expect(renderCursorRulesPaths([])).toEqual([]);
  });

  it("frontmatter carries description, empty globs, alwaysApply: false by default", () => {
    const fm = buildCursorRuleFrontmatter({ description: "short desc" });
    expect(fm).toContain("description: short desc");
    expect(fm).toContain("globs:");
    expect(fm).toMatch(/alwaysApply:\s*false/);
    expect(fm.startsWith("---")).toBe(true);
    expect(fm.endsWith("---")).toBe(true);
  });

  it("quotes descriptions that contain YAML indicators", () => {
    const fm = buildCursorRuleFrontmatter({ description: "has: colon" });
    expect(fm).toContain('description: "has: colon"');
  });

  it("includes governance footer with version, last-verified, status, and source list", () => {
    const skill = makeSkill({
      id: "gov",
      slug: "gov",
      version: "1.2.3",
      status: "maintainer-reviewed",
      lastVerified: "2026-02-15",
      sources: [{ title: "ZATCA", url: "https://zatca.gov.sa", accessed: "2026-01-01" }],
    });
    const md = buildCursorRuleMarkdown(skill);
    expect(md).toContain("_Version: 1.2.3");
    expect(md).toContain("Last verified: 2026-02-15");
    expect(md).toContain("Status: maintainer-reviewed");
    expect(md).toContain("[ZATCA](https://zatca.gov.sa)");
  });

  it("prepends a disclaimer when the skill declares one", () => {
    const skill = makeSkill({ id: "comp", slug: "comp", disclaimer: true });
    const md = buildCursorRuleMarkdown(skill);
    expect(md).toContain("Engineering guidance, not legal advice");
  });

  it("does not emit a disclaimer when disclaimer is false", () => {
    const skill = makeSkill({ id: "neutral", slug: "neutral", disclaimer: false });
    const md = buildCursorRuleMarkdown(skill);
    expect(md).not.toContain("Engineering guidance, not legal advice");
  });

  it("uses skill.summary.en as the frontmatter description when present", () => {
    const skill = makeSkill({
      id: "x",
      slug: "x",
      summary: { en: "English summary", ar: "ملخص عربي" },
    });
    const md = buildCursorRuleMarkdown(skill);
    expect(md).toMatch(/description:\s*"?English summary/);
  });
});
