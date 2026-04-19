import { describe, expect, it } from "vitest";

import type { ReviewSelections } from "@/components/questionnaire/step-review";
import {
  buildFilePlan,
  buildFilesForTarget,
  getActiveSkills,
  groupFilesByDirectory,
  orderTargets,
} from "@/lib/generate/file-plan";
import type { GeneratedSkill } from "@/lib/skills/generated";

function makeSkill(
  overrides: Partial<GeneratedSkill> & Pick<GeneratedSkill, "id" | "slug">,
): GeneratedSkill {
  const { id, slug, ...rest } = overrides;
  return {
    id,
    name: { en: id, ar: id },
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
    references: [{ path: "ref-a" }, { path: "ref-b" }],
    scripts: [{ path: "script-a" }],
  });

  it("claude-code emits SKILL.md plus references and scripts", () => {
    expect(buildFilesForTarget("claude-code", [skill])).toEqual([
      ".claude/skills/s/SKILL.md",
      ".claude/skills/s/references/ref-1.md",
      ".claude/skills/s/references/ref-2.md",
      ".claude/skills/s/scripts/helper-1.sh",
    ]);
  });

  it("cursor emits one .mdc file per skill", () => {
    const other = makeSkill({ id: "o", slug: "other" });
    expect(buildFilesForTarget("cursor", [skill, other])).toEqual([
      ".cursor/rules/s.mdc",
      ".cursor/rules/other.mdc",
    ]);
  });

  it("codex and agents-md emit a single AGENTS.md", () => {
    expect(buildFilesForTarget("codex", [skill])).toEqual(["AGENTS.md"]);
    expect(buildFilesForTarget("agents-md", [skill])).toEqual(["AGENTS.md"]);
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
      ".claude/skills/s/SKILL.md",
      "AGENTS.md",
    ]);
    expect(groups).toEqual([
      {
        directory: ".claude/skills/s",
        files: ["SKILL.md", "SKILL.md"],
      },
      {
        directory: ".claude/skills/s/references",
        files: ["ref-1.md"],
      },
      { directory: ".", files: ["AGENTS.md"] },
    ]);
  });
});

describe("buildFilePlan", () => {
  const skill = makeSkill({
    id: "s",
    slug: "s",
    references: [{ path: "ref-a" }],
    scripts: [],
  });

  it("aggregates totals across every selected target", () => {
    const plan = buildFilePlan(["claude-code", "cursor"], [skill]);
    expect(plan.skillCount).toBe(1);
    expect(plan.totalFiles).toBe(3);
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
      targets: [
        { target: "claude-code", files: [], groups: [] },
      ],
      totalFiles: 0,
      skillCount: 0,
    });
  });
});
