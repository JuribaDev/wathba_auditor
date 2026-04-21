import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  loadSkillsFromDirectory,
  SkillLoaderError,
} from "../../../../scripts/lib/skill-loader";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "wathba-skill-lifecycle-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

async function writeSkill(
  repoRoot: string,
  relativeDir: string,
  yamlOverrides: Record<string, string> = {},
): Promise<void> {
  const directory = path.join(repoRoot, "skills", relativeDir);
  await fs.mkdir(directory, { recursive: true });
  const leaf = relativeDir.split("/").filter(Boolean).at(-1) ?? "sample";
  const id = yamlOverrides.id ?? `arch-${leaf}`;
  const lifecycleLines =
    yamlOverrides.lifecycle !== undefined ? `\nlifecycle: ${yamlOverrides.lifecycle}` : "";
  const replacementLines =
    yamlOverrides.replacement_id !== undefined
      ? `\nreplacement_id: ${yamlOverrides.replacement_id}`
      : "";
  const sunsetLines =
    yamlOverrides.sunset_date !== undefined
      ? `\nsunset_date: "${yamlOverrides.sunset_date}"`
      : "";
  const yaml = `id: ${id}
name:
  en: Sample Skill ${leaf}
  ar: عينة ${leaf}
slug: ${leaf}
version: 0.1.0
category: architecture
region: null
targets:
  - claude-code
status: draft
last_verified: "2026-04-19"
maintainers:
  - github: example
sources:
  - title: Example
    url: https://example.com
    accessed: "2026-04-19"
disclaimer: false
variables: []
triggers: []${lifecycleLines}${replacementLines}${sunsetLines}
`;
  await fs.writeFile(path.join(directory, "skill.yaml"), yaml, "utf8");
  await fs.writeFile(path.join(directory, "SKILL.md"), "# body", "utf8");
}

describe("skill-loader lifecycle", () => {
  it("defaults lifecycle to active when not declared", async () => {
    await writeSkill(workspace, "architecture/sample");
    const skills = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });
    expect(skills).toHaveLength(1);
    expect(skills[0].lifecycle).toBe("active");
    expect(skills[0].replacementId).toBeNull();
    expect(skills[0].sunsetDate).toBeNull();
    expect(skills[0].lifecycleNote).toBeNull();
  });

  it("threads lifecycle / replacement / sunset through the generated shape", async () => {
    await writeSkill(workspace, "architecture/target", { id: "arch-target" });
    await writeSkill(workspace, "architecture/sample", {
      id: "arch-sample",
      lifecycle: "deprecated",
      replacement_id: "arch-target",
      sunset_date: "2026-12-31",
    });
    const skills = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });
    const sample = skills.find((s) => s.id === "arch-sample")!;
    expect(sample.lifecycle).toBe("deprecated");
    expect(sample.replacementId).toBe("arch-target");
    expect(sample.sunsetDate).toBe("2026-12-31");
  });

  it("rejects a replacement_id that does not resolve to an existing skill", async () => {
    await writeSkill(workspace, "architecture/sample", {
      id: "arch-sample",
      lifecycle: "deprecated",
      replacement_id: "ghost",
    });
    await expect(
      loadSkillsFromDirectory({
        skillsRoot: path.join(workspace, "skills"),
        repoRoot: workspace,
      }),
    ).rejects.toThrow(SkillLoaderError);
  });

  it("rejects a self-referential replacement_id at the schema layer", async () => {
    await writeSkill(workspace, "architecture/sample", {
      id: "arch-sample",
      lifecycle: "deprecated",
      replacement_id: "arch-sample",
    });
    await expect(
      loadSkillsFromDirectory({
        skillsRoot: path.join(workspace, "skills"),
        repoRoot: workspace,
      }),
    ).rejects.toThrow();
  });
});
