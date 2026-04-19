import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  loadSkillsFromDirectory,
  SkillLoaderError,
  SkillValidationError,
} from "../../../../scripts/lib/skill-loader";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "wathba-skill-loader-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

async function writeSkill(
  repoRoot: string,
  relativeDir: string,
  overrides: { yaml?: string; markdown?: string | null; references?: Record<string, string>; scripts?: Record<string, string> } = {},
) {
  const directory = path.join(repoRoot, "skills", relativeDir);
  await fs.mkdir(directory, { recursive: true });

  const defaultYaml = `id: saudi-sample
name:
  en: Sample Skill
  ar: عينة مهارة
slug: sample-skill
version: 0.1.0
category: compliance
region: saudi_arabia
targets:
  - claude-code
status: maintainer-reviewed
last_verified: "2026-04-19"
maintainers:
  - github: example
sources:
  - title: Example
    url: https://example.com
    accessed: "2026-04-19"
disclaimer: true
variables: []
triggers: []
`;

  await fs.writeFile(path.join(directory, "skill.yaml"), overrides.yaml ?? defaultYaml, "utf8");

  if (overrides.markdown !== null) {
    await fs.writeFile(
      path.join(directory, "SKILL.md"),
      overrides.markdown ?? "# Sample\nBody.\n",
      "utf8",
    );
  }

  if (overrides.references) {
    const refDir = path.join(directory, "references");
    await fs.mkdir(refDir, { recursive: true });
    for (const [name, content] of Object.entries(overrides.references)) {
      await fs.writeFile(path.join(refDir, name), content, "utf8");
    }
  }

  if (overrides.scripts) {
    const scriptDir = path.join(directory, "scripts");
    await fs.mkdir(scriptDir, { recursive: true });
    for (const [name, content] of Object.entries(overrides.scripts)) {
      await fs.writeFile(path.join(scriptDir, name), content, "utf8");
    }
  }

  return directory;
}

describe("loadSkillsFromDirectory", () => {
  it("loads a valid skill with references and scripts", async () => {
    await writeSkill(workspace, "saudi/sample", {
      references: { "guide.md": "# Guide" },
      scripts: { "check.mjs": "console.log('ok')" },
    });

    const skills = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    expect(skills).toHaveLength(1);
    const skill = skills[0];
    expect(skill.id).toBe("saudi-sample");
    expect(skill.lastVerified).toBe("2026-04-19");
    expect(skill.directory).toBe(path.join("saudi", "sample"));
    expect(skill.references).toEqual([{ path: "guide.md", content: "# Guide" }]);
    expect(skill.scripts).toEqual([{ path: "check.mjs", content: "console.log('ok')" }]);
    expect(skill.body).toContain("Sample");
  });

  it("sorts skills by id for deterministic output", async () => {
    await writeSkill(workspace, "z/later", {
      yaml: `id: zz-later
name: { en: Later, ar: لاحق }
slug: later
version: 0.1.0
category: security
region: null
targets: [claude-code]
status: draft
last_verified: "2026-04-19"
maintainers: [{ github: ex }]
sources: [{ title: s, url: "https://example.com", accessed: "2026-04-19" }]
disclaimer: false
variables: []
triggers: []
`,
    });
    await writeSkill(workspace, "a/earlier", {
      yaml: `id: aa-earlier
name: { en: Earlier, ar: سابق }
slug: earlier
version: 0.1.0
category: security
region: null
targets: [claude-code]
status: draft
last_verified: "2026-04-19"
maintainers: [{ github: ex }]
sources: [{ title: s, url: "https://example.com", accessed: "2026-04-19" }]
disclaimer: false
variables: []
triggers: []
`,
    });

    const skills = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    expect(skills.map((s) => s.id)).toEqual(["aa-earlier", "zz-later"]);
  });

  it("throws SkillValidationError on invalid metadata with the source path", async () => {
    await writeSkill(workspace, "saudi/broken", {
      yaml: `id: broken
name:
  en: Broken
slug: broken
version: 0.1.0
category: compliance
region: null
targets: []
status: maintainer-reviewed
last_verified: "2026-04-19"
maintainers: []
sources: []
disclaimer: false
variables: []
triggers: []
`,
    });

    await expect(
      loadSkillsFromDirectory({
        skillsRoot: path.join(workspace, "skills"),
        repoRoot: workspace,
      }),
    ).rejects.toMatchObject({
      name: "SkillValidationError",
      message: expect.stringContaining("skills/saudi/broken/skill.yaml"),
    });
  });

  it("throws SkillLoaderError when SKILL.md is missing", async () => {
    await writeSkill(workspace, "saudi/bodyless", { markdown: null });

    const call = loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    await expect(call).rejects.toBeInstanceOf(SkillLoaderError);
    await expect(call).rejects.toMatchObject({
      message: expect.stringContaining("Missing SKILL.md"),
    });
  });

  it("throws SkillLoaderError when two skills share the same id", async () => {
    await writeSkill(workspace, "saudi/one");
    await writeSkill(workspace, "security/two");

    const call = loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    await expect(call).rejects.toBeInstanceOf(SkillLoaderError);
    await expect(call).rejects.toMatchObject({
      message: expect.stringMatching(/Duplicate skill id "saudi-sample"/),
    });
  });

  it("re-exports SkillValidationError so callers catch schema failures from one import", () => {
    const err = new SkillValidationError(
      [{ code: "custom", message: "bad", path: ["x"] } as never],
      "skills/test.yaml",
    );
    expect(err).toBeInstanceOf(SkillValidationError);
    expect(err.name).toBe("SkillValidationError");
    expect(err.message).toContain("skills/test.yaml");
  });
});
