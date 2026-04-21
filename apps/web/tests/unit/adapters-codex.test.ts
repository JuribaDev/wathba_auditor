import { describe, expect, it } from "vitest";

import { renderCodexFiles, renderCodexPaths } from "@/lib/generate/adapters/codex";
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
    targets: ["codex"],
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

describe("renderCodexFiles", () => {
  it("returns an empty list when no skills are active", () => {
    expect(renderCodexFiles([], [])).toEqual([]);
    expect(renderCodexPaths([])).toEqual([]);
  });

  it("emits a native .agents/skills/<slug>/SKILL.md per skill", () => {
    const a = makeSkill({ id: "a", slug: "alpha" });
    const b = makeSkill({ id: "b", slug: "beta" });
    const files = renderCodexFiles(
      [a, b],
      [
        makeResolution({ skillId: "a", slug: "alpha", body: "A body" }),
        makeResolution({ skillId: "b", slug: "beta", body: "B body" }),
      ],
    );
    expect(files.map((file) => file.path)).toEqual([
      ".agents/skills/alpha/SKILL.md",
      ".agents/skills/beta/SKILL.md",
    ]);
  });

  it("never emits AGENTS.md — that is the separate generic adapter", () => {
    const skill = makeSkill({ id: "a", slug: "alpha" });
    const files = renderCodexFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    for (const file of files) {
      expect(file.path).not.toBe("AGENTS.md");
      expect(file.path.startsWith(".agents/skills/")).toBe(true);
    }
  });

  it("uses open-standard frontmatter (name, description) only", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      summary: { en: "Short A description", ar: "وصف أ" },
      version: "1.2.3",
      status: "maintainer-reviewed",
      lastVerified: "2026-02-10",
    });
    const [file] = renderCodexFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "Hello world." })],
    );
    expect(file.content.startsWith("---\n")).toBe(true);
    expect(file.content).toContain("name: alpha");
    expect(file.content).toContain("description: Short A description");
    expect(file.content).not.toMatch(/^version:/m);
    expect(file.content).not.toMatch(/^status:/m);
    expect(file.content).toContain(
      "_Version: 1.2.3 · Last verified: 2026-02-10 · Status: maintainer-reviewed_",
    );
    expect(file.content).toContain("Hello world.");
  });

  it("preserves supporting files including an optional agents/openai.yaml", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      files: [
        textFile("references/guide.md", "# guide"),
        textFile("scripts/run.sh", "#!/bin/sh"),
        textFile(
          "agents/openai.yaml",
          "interface:\n  display_name: Alpha\n",
        ),
        textFile("assets/icon.svg", "<svg/>"),
      ],
    });
    const files = renderCodexFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    const paths = files.map((f) => f.path);
    expect(paths).toEqual([
      ".agents/skills/alpha/SKILL.md",
      ".agents/skills/alpha/references/guide.md",
      ".agents/skills/alpha/scripts/run.sh",
      ".agents/skills/alpha/agents/openai.yaml",
      ".agents/skills/alpha/assets/icon.svg",
    ]);
    const openaiYaml = files.find(
      (f) => f.path === ".agents/skills/alpha/agents/openai.yaml",
    );
    expect(openaiYaml?.content).toContain("display_name: Alpha");
  });

  it("does not fabricate an agents/openai.yaml when one is not authored", () => {
    const skill = makeSkill({ id: "a", slug: "alpha" });
    const files = renderCodexFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    const openaiYaml = files.find((f) => f.path.endsWith("/agents/openai.yaml"));
    expect(openaiYaml).toBeUndefined();
  });

  it("falls back to the raw skill body when a resolution is missing", () => {
    const skill = makeSkill({
      id: "a",
      slug: "alpha",
      body: "# Raw body\n{{stack}}",
    });
    const [file] = renderCodexFiles([skill], []);
    expect(file.content).toContain("# Raw body");
    expect(file.content).toContain("{{stack}}");
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
    const a = renderCodexFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    const b = renderCodexFiles(
      [skill],
      [makeResolution({ skillId: "a", slug: "alpha", body: "body" })],
    );
    expect(a[0].content).toBe(b[0].content);
  });
});
