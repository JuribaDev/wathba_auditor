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
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";
import type { ReviewSelections } from "@/components/questionnaire/step-review";

function selectByIds(ids: readonly string[]): ReviewSelections {
  const selections: ReviewSelections = {};
  for (const id of ids) {
    selections[id] = { on: true, source: "manual" };
  }
  return selections;
}

function withBinary(skill: GeneratedSkill): GeneratedSkill {
  // Embed a synthetic 4-byte PNG-like payload so zip round-trip can be verified.
  const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(bytes).toString("base64")
      : btoa(String.fromCharCode(...bytes));
  return {
    ...skill,
    files: [
      ...skill.files,
      { path: "assets/logo.png", encoding: "base64", content: base64 },
    ],
  };
}

describe("formatZipDate", () => {
  it("formats year-month-day with zero-padding", () => {
    expect(formatZipDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatZipDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("buildZipFilename", () => {
  it("produces wathba-skills-date style filename", () => {
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

  it("dispatches to the right native adapter for each target", () => {
    const claude = buildTargetFiles("claude-code", skills, resolutions);
    expect(claude.some((f) => f.path.startsWith(".claude/skills/"))).toBe(true);

    const cursor = buildTargetFiles("cursor", skills, resolutions);
    // Cursor target ships both durable rules (.cursor/rules/*.mdc) and the
    // Agent Skills interop package (.cursor/skills/<slug>/SKILL.md).
    expect(cursor.every(
      (f) =>
        f.path.startsWith(".cursor/rules/") ||
        f.path.startsWith(".cursor/skills/"),
    )).toBe(true);
    expect(cursor.some((f) => f.path.startsWith(".cursor/rules/"))).toBe(true);
    expect(cursor.some((f) => f.path.startsWith(".cursor/skills/"))).toBe(true);

    const codex = buildTargetFiles("codex", skills, resolutions);
    expect(codex.every((f) => f.path.startsWith(".agents/skills/"))).toBe(true);
    expect(codex.every((f) => f.path !== "AGENTS.md")).toBe(true);

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
    const agents: TargetAgent[] = ["claude-code", "cursor", "codex", "agents-md"];
    const plan = buildFilePlan(agents, getActiveSkills(generatedSkills, selections));
    const { resolutions } = resolveSelectedSkills(skills, {}, {});
    const files = collectAllFiles(plan, skills, resolutions);
    const paths = files.map((f) => f.path);
    const claudeIdx = paths.findIndex((p) => p.startsWith(".claude/"));
    const cursorIdx = paths.findIndex((p) => p.startsWith(".cursor/"));
    const codexIdx = paths.findIndex((p) => p.startsWith(".agents/"));
    const agentsMdIdx = paths.findIndex((p) => p === "AGENTS.md");
    expect(claudeIdx).toBeGreaterThanOrEqual(0);
    expect(cursorIdx).toBeGreaterThan(claudeIdx);
    expect(codexIdx).toBeGreaterThan(cursorIdx);
    expect(agentsMdIdx).toBeGreaterThan(codexIdx);
  });
});

describe("buildZipBlob", () => {
  it("packages all target files into a readable zip", async () => {
    const firstSkill = generatedSkills[0];
    const skills = [firstSkill];
    const selections = selectByIds([firstSkill.id]);
    const agents: TargetAgent[] = ["claude-code", "cursor", "codex", "agents-md"];
    const plan = buildFilePlan(agents, getActiveSkills(generatedSkills, selections));
    const { resolutions } = resolveSelectedSkills(skills, {}, {});
    const blob = await buildZipBlob(plan, skills, resolutions);
    expect(blob).toBeInstanceOf(Blob);
    const arrayBuffer = await blob.arrayBuffer();
    const unzipped = await JSZip.loadAsync(arrayBuffer);
    const paths = Object.keys(unzipped.files).filter(
      (name) => !unzipped.files[name].dir,
    );
    expect(paths.some((p) => p.startsWith(".claude/skills/"))).toBe(true);
    expect(paths.some((p) => p.startsWith(".cursor/skills/"))).toBe(true);
    expect(paths.some((p) => p.startsWith(".agents/skills/"))).toBe(true);
    expect(paths).toContain("AGENTS.md");
    const agentsMd = await unzipped.file("AGENTS.md")!.async("string");
    expect(agentsMd).toContain(firstSkill.name.en);
  });

  it("round-trips binary support files losslessly", async () => {
    const base = generatedSkills[0];
    const skill = withBinary(base);
    const skills = [skill];
    const selections = selectByIds([skill.id]);
    const agents: TargetAgent[] = ["claude-code"];
    const plan = buildFilePlan(agents, getActiveSkills(skills, selections));
    const { resolutions } = resolveSelectedSkills(skills, {}, {});
    const blob = await buildZipBlob(plan, skills, resolutions);
    const unzipped = await JSZip.loadAsync(await blob.arrayBuffer());
    const target = `.claude/skills/${skill.slug}/assets/logo.png`;
    const entry = unzipped.file(target);
    expect(entry).not.toBeNull();
    const bytes = await entry!.async("uint8array");
    expect(Array.from(bytes)).toEqual([0x89, 0x50, 0x4e, 0x47]);
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
