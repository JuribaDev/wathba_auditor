import { describe, expect, it } from "vitest";

import { renderCursorFiles } from "@/lib/generate/adapters/cursor";
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

describe("renderCursorFiles", () => {
  it("returns an empty list when no skills are active", () => {
    expect(renderCursorFiles([], [])).toEqual([]);
  });

  it("emits one .cursor/rules/<slug>.mdc per skill with frontmatter and resolved body", () => {
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
    expect(file.path).toBe(".cursor/rules/alpha.mdc");
    expect(file.content.startsWith("---\n")).toBe(true);
    expect(file.content).toContain("description: Short A description");
    expect(file.content).toContain("alwaysApply: true");
    expect(file.content).toContain("# Resolved body");
    expect(file.content.endsWith("Hello world.\n")).toBe(true);
  });

  it("appends a read-only assets note when the skill has references or scripts", () => {
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
    const [file] = renderCursorFiles([skill], [resolution]);
    expect(file.content).toContain("## Read-only assets");
    expect(file.content).toContain("sample.xml, guide.md");
    expect(file.content).toContain(
      "Helper scripts (read-only in Cursor): validate.mjs",
    );
  });

  it("omits the read-only note when there are no references or scripts", () => {
    const skill = makeSkill({ id: "a", slug: "alpha" });
    const [file] = renderCursorFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    expect(file.content).not.toContain("Read-only assets");
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

  it("renders each selected skill into its own .cursor/rules/<slug>.mdc file", () => {
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
      ".cursor/rules/alpha.mdc",
      ".cursor/rules/beta.mdc",
    ]);
    expect(files[0].content).toContain("one");
    expect(files[1].content).toContain("two");
  });
});
