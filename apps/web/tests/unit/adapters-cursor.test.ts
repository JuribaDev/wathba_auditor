import { describe, expect, it } from "vitest";

import { renderCursorFiles, renderCursorPaths } from "@/lib/generate/adapters/cursor";
import type { SkillResolution } from "@/lib/generate/resolve-markdown";
import type { GeneratedSkill, SkillFile } from "@/lib/skills/generated";

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
    body: "",
    directory: slug,
    files: [],
    references: [],
    scripts: [],
    ...rest,
  };
}

function textFile(filePath: string, content: string): SkillFile {
  return { path: filePath, encoding: "utf-8", content };
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

describe("renderCursorFiles", () => {
  it("returns an empty list when no skills are active", () => {
    expect(renderCursorFiles([], [])).toEqual([]);
    expect(renderCursorPaths([])).toEqual([]);
  });

  it("emits a native .cursor/skills/<slug>/SKILL.md per skill with open-standard frontmatter", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      summary: { en: "Short A description", ar: "وصف أ" },
    });
    const resolution = makeResolution({
      skillId: "a",
      slug: "alpha",
      body: "# Resolved body\n\nHello world.",
    });
    const files = renderCursorFiles([skill], [resolution]);
    expect(files).toHaveLength(1);
    const [file] = files;
    expect(file.path).toBe(".cursor/skills/alpha/SKILL.md");
    expect(file.encoding).toBe("utf-8");
    expect(file.content.startsWith("---\n")).toBe(true);
    expect(file.content).toContain("name: alpha");
    expect(file.content).toContain("description: Short A description");
    expect(file.content).toContain("# Resolved body");
    // Cursor's agent skills format does NOT use `globs` / `alwaysApply` — those are
    // legacy Cursor *rules* fields and must not leak into the skills export.
    expect(file.content).not.toContain("globs:");
    expect(file.content).not.toContain("alwaysApply");
  });

  it("never emits any file under .cursor/rules/", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      files: [textFile("references/sample.xml", "<xml/>")],
    });
    const files = renderCursorFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    for (const file of files) {
      expect(file.path.startsWith(".cursor/rules/")).toBe(false);
      expect(file.path.startsWith(".cursor/skills/")).toBe(true);
      expect(file.path.endsWith(".mdc")).toBe(false);
    }
  });

  it("preserves support files under the skill directory, including nested subdirectories", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      files: [
        textFile("references/sample.xml", "<xml/>"),
        textFile("scripts/validate.mjs", "console.log('ok')"),
        textFile("assets/diagrams/arch.md", "# arch"),
      ],
    });
    const files = renderCursorFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    expect(files.map((f) => f.path)).toEqual([
      ".cursor/skills/alpha/SKILL.md",
      ".cursor/skills/alpha/references/sample.xml",
      ".cursor/skills/alpha/scripts/validate.mjs",
      ".cursor/skills/alpha/assets/diagrams/arch.md",
    ]);
  });

  it("surfaces compliance disclaimers in the body, not in frontmatter", () => {
    const skill = makeSkill({ id: "a", slug: "alpha", disclaimer: true });
    const [file] = renderCursorFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    expect(file.content).toContain(
      "> Engineering guidance, not legal advice.",
    );
    expect(file.content).not.toMatch(/^disclaimer:/m);
  });

  it("falls back to the skill's raw body when a resolution is missing", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      body: "# Raw body\n{{stack}}",
    });
    const [file] = renderCursorFiles([skill], []);
    expect(file.content).toContain("# Raw body");
    expect(file.content).toContain("{{stack}}");
  });

  it("renders each selected skill into its own directory", () => {
    const alpha = makeSkill({ id: "a", slug: "alpha" });
    const beta = makeSkill({ id: "b", slug: "beta" });
    const files = renderCursorFiles(
      [alpha, beta],
      [
        makeResolution({ skillId: "a", slug: "alpha", body: "one" }),
        makeResolution({ skillId: "b", slug: "beta", body: "two" }),
      ],
    );
    expect(files.map((file) => file.path)).toEqual([
      ".cursor/skills/alpha/SKILL.md",
      ".cursor/skills/beta/SKILL.md",
    ]);
    expect(files[0].content).toContain("one");
    expect(files[1].content).toContain("two");
  });

  it("is deterministic for identical inputs", () => {
    const skill = makeSkill({ id: "a", slug: "alpha" });
    const first = renderCursorFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    const second = renderCursorFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    expect(first[0].content).toBe(second[0].content);
  });
});
