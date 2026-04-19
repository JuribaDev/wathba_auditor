import { describe, expect, it } from "vitest";

import { renderClaudeCodeFiles } from "@/lib/generate/adapters/claude-code";
import type { SkillResolution } from "@/lib/generate/resolve-markdown";
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
    body: "",
    directory: slug,
    references: [],
    scripts: [],
    ...rest,
  };
}

function makeResolution(
  overrides: Partial<SkillResolution> &
    Pick<SkillResolution, "skillId" | "slug" | "body">,
): SkillResolution {
  return {
    missing: [],
    ...overrides,
  };
}

describe("renderClaudeCodeFiles", () => {
  it("returns an empty list when no skills are active", () => {
    expect(renderClaudeCodeFiles([], [])).toEqual([]);
  });

  it("emits SKILL.md with resolved frontmatter and body", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      summary: { en: "Short A description", ar: "وصف أ" },
      version: "1.2.3",
      status: "maintainer-reviewed",
      lastVerified: "2026-03-18",
    });
    const resolution = makeResolution({
      skillId: "a",
      slug: "alpha",
      body: "# Resolved body\n\nHello world.",
    });
    const files = renderClaudeCodeFiles([skill], [resolution]);
    expect(files).toHaveLength(1);
    const [file] = files;
    expect(file.path).toBe(".claude/skills/alpha/SKILL.md");
    expect(file.content).toContain("---\nname: alpha\n");
    expect(file.content).toContain("description: Short A description");
    expect(file.content).toContain("version: 1.2.3");
    expect(file.content).toContain("status: maintainer-reviewed");
    expect(file.content).toContain('last_verified: "2026-03-18"');
    expect(file.content).not.toContain("disclaimer: true");
    expect(file.content.endsWith("Hello world.\n")).toBe(true);
  });

  it("includes disclaimer marker when the skill carries a disclaimer", () => {
    const skill = makeSkill({ id: "a", slug: "alpha", disclaimer: true });
    const resolution = makeResolution({
      skillId: "a",
      slug: "alpha",
      body: "body",
    });
    const [file] = renderClaudeCodeFiles([skill], [resolution]);
    expect(file.content).toContain("disclaimer: true");
  });

  it("emits reference and script files verbatim under real filenames", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      references: [
        { path: "sample.xml", content: "<xml/>" },
        { path: "guide.md", content: "# guide" },
      ],
      scripts: [{ path: "validate.mjs", content: "console.log('ok')" }],
    });
    const resolution = makeResolution({
      skillId: "a",
      slug: "alpha",
      body: "body",
    });
    const files = renderClaudeCodeFiles([skill], [resolution]);
    expect(files.map((file) => file.path)).toEqual([
      ".claude/skills/alpha/SKILL.md",
      ".claude/skills/alpha/references/sample.xml",
      ".claude/skills/alpha/references/guide.md",
      ".claude/skills/alpha/scripts/validate.mjs",
    ]);
    expect(files[1].content).toBe("<xml/>");
    expect(files[2].content).toBe("# guide");
    expect(files[3].content).toBe("console.log('ok')");
  });

  it("falls back to the skill's raw body when a resolution is missing", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      body: "# Raw body\n{{stack}}",
    });
    const [file] = renderClaudeCodeFiles([skill], []);
    expect(file.content).toContain("# Raw body");
    expect(file.content).toContain("{{stack}}");
  });

  it("renders each selected skill into its own .claude/skills/<slug> folder", () => {
    const alpha = makeSkill({
      id: "a",
      slug: "alpha",
      references: [{ path: "a.md", content: "a" }],
    });
    const beta = makeSkill({
      id: "b",
      slug: "beta",
      scripts: [{ path: "b.sh", content: "b" }],
    });
    const files = renderClaudeCodeFiles(
      [alpha, beta],
      [
        makeResolution({ skillId: "a", slug: "alpha", body: "one" }),
        makeResolution({ skillId: "b", slug: "beta", body: "two" }),
      ],
    );
    expect(files.map((file) => file.path)).toEqual([
      ".claude/skills/alpha/SKILL.md",
      ".claude/skills/alpha/references/a.md",
      ".claude/skills/beta/SKILL.md",
      ".claude/skills/beta/scripts/b.sh",
    ]);
  });
});
