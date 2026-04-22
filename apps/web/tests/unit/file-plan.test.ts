import { describe, expect, it } from "vitest";

import type { ReviewSelections } from "@/components/questionnaire/step-review";
import {
  buildFilePlan,
  buildFilesForTarget,
  getActiveSkills,
  groupFilesByDirectory,
  orderTargets,
} from "@/lib/generate/file-plan";
import type { GeneratedSkill, SkillFile } from "@/lib/skills/generated";

function makeSkill(
  overrides: Partial<GeneratedSkill> & Pick<GeneratedSkill, "id" | "slug">,
): GeneratedSkill {
  const { id, slug, ...rest } = overrides;
  return {
    id,
    name: { en: id, ar: id },
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

describe("getActiveSkills", () => {
  const catalog = [
    makeSkill({ id: "a", slug: "a" }),
    makeSkill({ id: "b", slug: "b" }),
  ];

  it("returns only selections that are on", () => {
    const selections: ReviewSelections = {
      a: { on: true, source: "auto" },
      b: { on: false, source: "manual" },
    };
    expect(getActiveSkills(catalog, selections).map((s) => s.id)).toEqual(["a"]);
  });

  it("excludes skills without a selection entry", () => {
    expect(getActiveSkills(catalog, {})).toEqual([]);
  });
});

describe("orderTargets", () => {
  it("returns targets in canonical order regardless of input order", () => {
    expect(orderTargets(["codex", "claude-code", "cursor"])).toEqual([
      "claude-code",
      "cursor",
      "codex",
    ]);
  });

  it("returns an empty array when no agents are provided", () => {
    expect(orderTargets(undefined)).toEqual([]);
    expect(orderTargets([])).toEqual([]);
  });
});

describe("buildFilesForTarget", () => {
  const skill = makeSkill({
    id: "s",
    slug: "s",
    files: [
      textFile("references/ref-a.md", "a"),
      textFile("references/ref-b.xml", "b"),
      textFile("scripts/helper.sh", "#!/bin/sh"),
    ],
  });

  it("claude-code emits SKILL.md plus support files under the skill directory", () => {
    expect(buildFilesForTarget("claude-code", [skill])).toEqual([
      ".claude/skills/s/SKILL.md",
      ".claude/skills/s/references/ref-a.md",
      ".claude/skills/s/references/ref-b.xml",
      ".claude/skills/s/scripts/helper.sh",
    ]);
  });

  it("cursor emits both .cursor/rules/*.mdc (durable) and .cursor/skills/ (Agent Skills interop)", () => {
    const other = makeSkill({ id: "o", slug: "other" });
    const paths = buildFilesForTarget("cursor", [skill, other]);
    // Rules come first (one .mdc per skill), then the per-skill Agent Skills package.
    expect(paths).toEqual([
      ".cursor/rules/s.mdc",
      ".cursor/rules/other.mdc",
      ".cursor/skills/s/SKILL.md",
      ".cursor/skills/s/references/ref-a.md",
      ".cursor/skills/s/references/ref-b.xml",
      ".cursor/skills/s/scripts/helper.sh",
      ".cursor/skills/other/SKILL.md",
    ]);
  });

  it("codex emits a native skill package per skill under .agents/skills/", () => {
    const paths = buildFilesForTarget("codex", [skill]);
    expect(paths).toEqual([
      ".agents/skills/s/SKILL.md",
      ".agents/skills/s/references/ref-a.md",
      ".agents/skills/s/references/ref-b.xml",
      ".agents/skills/s/scripts/helper.sh",
    ]);
    expect(paths.every((p) => p !== "AGENTS.md")).toBe(true);
  });

  it("agents-md is the only target that emits AGENTS.md", () => {
    expect(buildFilesForTarget("agents-md", [skill])).toEqual(["AGENTS.md"]);
    expect(buildFilesForTarget("codex", [skill]).includes("AGENTS.md")).toBe(
      false,
    );
  });

  it("returns an empty list when no skills are active", () => {
    expect(buildFilesForTarget("claude-code", [])).toEqual([]);
    expect(buildFilesForTarget("codex", [])).toEqual([]);
  });
});

describe("groupFilesByDirectory", () => {
  it("groups files under their parent directory preserving first-seen order", () => {
    const groups = groupFilesByDirectory([
      ".claude/skills/s/SKILL.md",
      ".claude/skills/s/references/ref-1.md",
      ".claude/skills/s/references/deep/ref-2.md",
      "AGENTS.md",
    ]);
    expect(groups).toEqual([
      { directory: ".claude/skills/s", files: ["SKILL.md"] },
      { directory: ".claude/skills/s/references", files: ["ref-1.md"] },
      { directory: ".claude/skills/s/references/deep", files: ["ref-2.md"] },
      { directory: ".", files: ["AGENTS.md"] },
    ]);
  });
});

describe("buildFilePlan", () => {
  const skill = makeSkill({
    id: "s",
    slug: "s",
    files: [textFile("references/ref-a.md", "a")],
  });

  it("aggregates totals across every selected target", () => {
    const plan = buildFilePlan(["claude-code", "cursor"], [skill]);
    expect(plan.skillCount).toBe(1);
    // claude-code → SKILL.md + 1 ref = 2 files.
    // cursor     → .cursor/rules/s.mdc + .cursor/skills/s/SKILL.md + 1 ref = 3 files.
    // Total: 5.
    expect(plan.totalFiles).toBe(5);
    expect(plan.targets.map((t) => t.target)).toEqual([
      "claude-code",
      "cursor",
    ]);
  });

  it("returns zero totals when no agents or skills are provided", () => {
    expect(buildFilePlan([], [skill])).toEqual({
      targets: [],
      totalFiles: 0,
      skillCount: 1,
    });
    expect(buildFilePlan(["claude-code"], [])).toEqual({
      targets: [{ target: "claude-code", files: [], groups: [] }],
      totalFiles: 0,
      skillCount: 0,
    });
  });
});
