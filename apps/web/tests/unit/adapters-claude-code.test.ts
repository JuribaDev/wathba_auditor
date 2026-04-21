import { describe, expect, it } from "vitest";

import { renderClaudeCodeFiles } from "@/lib/generate/adapters/claude-code";
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

describe("renderClaudeCodeFiles", () => {
  it("returns an empty list when no skills are active", () => {
    expect(renderClaudeCodeFiles([], [])).toEqual([]);
  });

  it("emits SKILL.md with native Claude frontmatter and resolved body", () => {
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
    expect(file.encoding).toBe("utf-8");
    // Docs-native frontmatter: only `name` and `description` are emitted. Governance
    // lives in the markdown body, never in undocumented frontmatter.
    expect(file.content).toContain("---\nname: alpha\n");
    expect(file.content).toContain("description: Short A description");
    expect(file.content).not.toMatch(/^version:/m);
    expect(file.content).not.toMatch(/^status:/m);
    expect(file.content).not.toMatch(/^last_verified:/m);
    expect(file.content).not.toMatch(/^disclaimer:/m);
    // Body + governance footer (version/last_verified/status in markdown).
    expect(file.content).toContain("# Resolved body");
    expect(file.content).toContain(
      "_Version: 1.2.3 · Last verified: 2026-03-18 · Status: maintainer-reviewed_",
    );
  });

  it("renders a disclaimer callout in the body for compliance skills with disclaimer", () => {
    const skill = makeSkill({ id: "a", slug: "alpha", disclaimer: true });
    const resolution = makeResolution({
      skillId: "a",
      slug: "alpha",
      body: "body",
    });
    const [file] = renderClaudeCodeFiles([skill], [resolution]);
    expect(file.content).toContain(
      "> Engineering guidance, not legal advice.",
    );
    expect(file.content).not.toContain("disclaimer: true");
  });

  it("emits support files verbatim under the skill directory (nested paths preserved)", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      files: [
        textFile("references/sample.xml", "<xml/>"),
        textFile("references/deep/guide.md", "# guide"),
        textFile("scripts/validate.mjs", "console.log('ok')"),
        textFile("assets/README.md", "assets"),
      ],
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
      ".claude/skills/alpha/references/deep/guide.md",
      ".claude/skills/alpha/scripts/validate.mjs",
      ".claude/skills/alpha/assets/README.md",
    ]);
    expect(files[1].content).toBe("<xml/>");
    expect(files[2].content).toBe("# guide");
    expect(files[3].content).toBe("console.log('ok')");
    expect(files[4].content).toBe("assets");
  });

  it("passes binary support files through without encoding changes", () => {
    const binary: SkillFile = {
      path: "assets/logo.png",
      encoding: "base64",
      content: "iVBORw0KGgoAAAANSUhEUg",
    };
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      files: [binary],
    });
    const [, asset] = renderClaudeCodeFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    expect(asset.path).toBe(".claude/skills/alpha/assets/logo.png");
    expect(asset.encoding).toBe("base64");
    expect(asset.content).toBe("iVBORw0KGgoAAAANSUhEUg");
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
      files: [textFile("references/a.md", "a")],
    });
    const beta = makeSkill({
      id: "b",
      slug: "beta",
      files: [textFile("scripts/b.sh", "b")],
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

  it("skips the governance footer when the body already contains one", () => {
    const skill = makeSkill({ id: "a", slug: "alpha" });
    const resolution = makeResolution({
      skillId: "a",
      slug: "alpha",
      body: "body\n\n_Version: 9.9.9 · Last verified: 2099-01-01_",
    });
    const [file] = renderClaudeCodeFiles([skill], [resolution]);
    const occurrences = (file.content.match(/_Version:/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it("is deterministic for identical inputs", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      disclaimer: true,
      sources: [
        { title: "Docs", url: "https://x.test", accessed: "2026-01-01" },
      ],
    });
    const first = renderClaudeCodeFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    const second = renderClaudeCodeFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    expect(first[0].content).toBe(second[0].content);
  });
});
