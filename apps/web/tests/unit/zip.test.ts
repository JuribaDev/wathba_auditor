import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import {
  buildFilePlan,
  getActiveSkills,
} from "@/lib/generate/file-plan";
import { resolveSelectedSkills } from "@/lib/generate/resolve-markdown";
import {
  buildTargetFiles,
  buildZipBlob,
  buildZipFilename,
  collectAllFiles,
  formatZipDate,
} from "@/lib/generate/zip";
import { generatedSkills } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";
import type { ReviewSelections } from "@/components/questionnaire/step-review";

function selectByIds(ids: readonly string[]): ReviewSelections {
  const selections: ReviewSelections = {};
  for (const id of ids) {
    selections[id] = { on: true, source: "manual" };
  }
  return selections;
}

describe("formatZipDate", () => {
  it("formats year-month-day with zero-padding", () => {
    expect(formatZipDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatZipDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("buildZipFilename", () => {
  it("produces project-skills-date style filename", () => {
    expect(buildZipFilename(new Date(2026, 3, 19))).toBe(
      "wathba-skills-2026-04-19.zip",
    );
  });

  it("defaults to now when no date provided", () => {
    const name = buildZipFilename();
    expect(name).toMatch(/^wathba-skills-\d{4}-\d{2}-\d{2}\.zip$/);
  });
});

describe("buildTargetFiles", () => {
  const firstSkill = generatedSkills[0];
  const skills = [firstSkill];
  const { resolutions } = resolveSelectedSkills(skills, {}, {});

  it("returns [] for empty skills", () => {
    expect(
      buildTargetFiles("claude-code", [], resolutions),
    ).toHaveLength(0);
  });

  it("dispatches to the right adapter for each target", () => {
    const claude = buildTargetFiles("claude-code", skills, resolutions);
    expect(claude.some((f) => f.path.startsWith(".claude/skills/"))).toBe(true);

    const cursor = buildTargetFiles("cursor", skills, resolutions);
    expect(cursor.every((f) => f.path.startsWith(".cursor/rules/"))).toBe(true);

    const codex = buildTargetFiles("codex", skills, resolutions);
    expect(codex).toHaveLength(1);
    expect(codex[0].path).toBe("AGENTS.md");

    const generic = buildTargetFiles("agents-md", skills, resolutions);
    expect(generic).toHaveLength(1);
    expect(generic[0].path).toBe("AGENTS.md");
  });
});

describe("collectAllFiles", () => {
  it("collects files for every plan target in order", () => {
    const firstSkill = generatedSkills[0];
    const skills = [firstSkill];
    const selections = selectByIds([firstSkill.id]);
    const agents: TargetAgent[] = ["claude-code", "cursor", "codex"];
    const plan = buildFilePlan(agents, getActiveSkills(generatedSkills, selections));
    const { resolutions } = resolveSelectedSkills(skills, {}, {});
    const files = collectAllFiles(plan, skills, resolutions);
    const paths = files.map((f) => f.path);
    const claudeIdx = paths.findIndex((p) => p.startsWith(".claude/"));
    const cursorIdx = paths.findIndex((p) => p.startsWith(".cursor/"));
    const codexIdx = paths.findIndex((p) => p === "AGENTS.md");
    expect(claudeIdx).toBeGreaterThanOrEqual(0);
    expect(cursorIdx).toBeGreaterThan(claudeIdx);
    expect(codexIdx).toBeGreaterThan(cursorIdx);
  });
});

describe("buildZipBlob", () => {
  it("packages all target files into a readable zip", async () => {
    const firstSkill = generatedSkills[0];
    const skills = [firstSkill];
    const selections = selectByIds([firstSkill.id]);
    const agents: TargetAgent[] = ["claude-code", "codex"];
    const plan = buildFilePlan(agents, getActiveSkills(generatedSkills, selections));
    const { resolutions } = resolveSelectedSkills(skills, {}, {});
    const blob = await buildZipBlob(plan, skills, resolutions);
    expect(blob).toBeInstanceOf(Blob);
    const arrayBuffer = await blob.arrayBuffer();
    const unzipped = await JSZip.loadAsync(arrayBuffer);
    const paths = Object.keys(unzipped.files).filter(
      (name) => !unzipped.files[name].dir,
    );
    expect(paths).toContain("AGENTS.md");
    expect(paths.some((p) => p.startsWith(".claude/skills/"))).toBe(true);
    const agentsMd = await unzipped.file("AGENTS.md")!.async("string");
    expect(agentsMd).toContain(firstSkill.name.en);
  });

  it("produces an empty zip when no targets are selected", async () => {
    const plan = buildFilePlan([], []);
    const blob = await buildZipBlob(plan, [], []);
    const unzipped = await JSZip.loadAsync(await blob.arrayBuffer());
    const paths = Object.keys(unzipped.files).filter(
      (name) => !unzipped.files[name].dir,
    );
    expect(paths).toHaveLength(0);
  });
});
