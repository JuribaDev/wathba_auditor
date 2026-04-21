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

type WriteOptions = {
  yaml?: string;
  markdown?: string | null;
  references?: Record<string, string>;
  scripts?: Record<string, string>;
  extraFiles?: Record<string, string | Buffer>;
};

async function writeSkill(
  repoRoot: string,
  relativeDir: string,
  overrides: WriteOptions = {},
) {
  const directory = path.join(repoRoot, "skills", relativeDir);
  await fs.mkdir(directory, { recursive: true });
  const leaf = relativeDir.split("/").filter(Boolean).at(-1) ?? "sample";

  const defaultYaml = `id: saudi-sample
name:
  en: Sample Skill
  ar: عينة مهارة
slug: ${leaf}
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

  await fs.writeFile(
    path.join(directory, "skill.yaml"),
    overrides.yaml ?? defaultYaml,
    "utf8",
  );

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

  if (overrides.extraFiles) {
    for (const [relativePath, content] of Object.entries(overrides.extraFiles)) {
      const target = path.join(directory, relativePath);
      await fs.mkdir(path.dirname(target), { recursive: true });
      if (typeof content === "string") {
        await fs.writeFile(target, content, "utf8");
      } else {
        await fs.writeFile(target, content);
      }
    }
  }

  return directory;
}

describe("loadSkillsFromDirectory", () => {
  it("loads a valid skill with references and scripts and exposes files[]", async () => {
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
    expect(skill.slug).toBe("sample");
    expect(skill.lastVerified).toBe("2026-04-19");
    // Directory is stored with POSIX separators regardless of host OS.
    expect(skill.directory).toBe("saudi/sample");
    expect(skill.files).toEqual([
      { path: "references/guide.md", encoding: "utf-8", content: "# Guide" },
      { path: "scripts/check.mjs", encoding: "utf-8", content: "console.log('ok')" },
    ]);
    expect(skill.references).toEqual([{ path: "guide.md", content: "# Guide" }]);
    expect(skill.scripts).toEqual([
      { path: "check.mjs", content: "console.log('ok')" },
    ]);
    expect(skill.body).toContain("Sample");
  });

  it("collects nested support directories recursively with POSIX paths", async () => {
    await writeSkill(workspace, "saudi/sample", {
      extraFiles: {
        "assets/diagrams/arch.md": "# arch",
        "assets/diagrams/deep/details.md": "detail",
        "agents/openai.yaml": "interface:\n  display_name: Sample\n",
      },
    });

    const [skill] = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    expect(skill.files.map((f) => f.path)).toEqual([
      "agents/openai.yaml",
      "assets/diagrams/arch.md",
      "assets/diagrams/deep/details.md",
    ]);
    // Legacy convenience lists only contain files directly under references/ or
    // scripts/; nested and out-of-scope directories live in `files` only.
    expect(skill.references).toEqual([]);
    expect(skill.scripts).toEqual([]);
  });

  it("classifies binary files as base64-encoded without mojibake", async () => {
    const binaryBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await writeSkill(workspace, "saudi/sample", {
      extraFiles: { "assets/logo.png": binaryBytes },
    });

    const [skill] = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    const logo = skill.files.find((f) => f.path === "assets/logo.png");
    expect(logo?.encoding).toBe("base64");
    expect(logo?.content).toBe(binaryBytes.toString("base64"));
  });

  it("ignores junk files such as .DS_Store and macOS resource forks", async () => {
    await writeSkill(workspace, "saudi/sample", {
      extraFiles: {
        ".DS_Store": "mac junk",
        "._guide.md": "apple-double",
        "Thumbs.db": "windows junk",
        "references/guide.md": "# guide",
      },
    });

    const [skill] = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    expect(skill.files.map((f) => f.path)).toEqual(["references/guide.md"]);
  });

  it("preserves legitimate nested dotfiles inside template bundles", async () => {
    // `.gitignore` / `.gitkeep` at the skill root are almost always accidental
    // and are filtered. Inside a `templates/` or `assets/` bundle they are
    // authored on purpose (the template ships with them) and must survive
    // packaging verbatim.
    await writeSkill(workspace, "saudi/sample", {
      extraFiles: {
        "templates/.gitignore": "node_modules\n",
        "templates/.gitkeep": "",
        "templates/README.md": "# template",
        ".gitignore": "# root-level junk, filtered",
      },
    });

    const [skill] = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    const paths = skill.files.map((f) => f.path);
    expect(paths).toContain("templates/.gitignore");
    expect(paths).toContain("templates/.gitkeep");
    expect(paths).toContain("templates/README.md");
    expect(paths).not.toContain(".gitignore");
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

  it("rejects skills nested at the wrong depth (skills/<slug>/skill.yaml)", async () => {
    await writeSkill(workspace, "topflat");

    const call = loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    await expect(call).rejects.toBeInstanceOf(SkillLoaderError);
    await expect(call).rejects.toMatchObject({
      message: expect.stringMatching(/Invalid skill folder depth/),
    });
  });

  it("fails fast on orphan skill.yaml files deeper than the canonical depth (not inside a canonical skill)", async () => {
    // `skills/saudi/group/sample/skill.yaml` (depth 3) with no `skills/saudi/group/
    // skill.yaml` above it is an orphan — the author clearly meant to create a
    // skill but placed it at the wrong depth. Silently dropping such files
    // makes contributor mistakes invisible, so the loader surfaces an explicit
    // "wrong depth" error. Genuine support bundles named skill.yaml remain
    // fine as long as they live inside a canonical skill package (covered by
    // the next test).
    await writeSkill(workspace, "saudi/group/sample");

    const call = loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    await expect(call).rejects.toBeInstanceOf(SkillLoaderError);
    await expect(call).rejects.toMatchObject({
      message: expect.stringMatching(/Invalid skill folder depth/),
    });
  });

  it("treats nested skill.yaml as a support file of the enclosing skill, not a second skill", async () => {
    // Regression: the old recursive walk matched any `skill.yaml` anywhere
    // under `skills/`. A skill that ships `templates/skill.yaml` as sample
    // config would explode with metadata/depth errors. The new walk is
    // 2-levels-only, and the nested file flows through as a support file.
    await writeSkill(workspace, "saudi/sample", {
      extraFiles: {
        "templates/skill.yaml": "id: sample-template\nname: Template\n",
      },
    });

    const skills = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    expect(skills).toHaveLength(1);
    expect(skills[0].files.map((f) => f.path)).toContain(
      "templates/skill.yaml",
    );
  });

  it("rejects a group folder that is not kebab-case", async () => {
    await writeSkill(workspace, "Saudi/sample");

    const call = loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    await expect(call).rejects.toBeInstanceOf(SkillLoaderError);
    await expect(call).rejects.toMatchObject({
      message: expect.stringMatching(/Invalid group folder "Saudi"/),
    });
  });

  it("rejects when leaf folder name does not match the skill slug", async () => {
    await writeSkill(workspace, "saudi/leaf-name", {
      yaml: `id: saudi-other
name: { en: Other, ar: آخر }
slug: a-different-slug
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

    const call = loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    await expect(call).rejects.toBeInstanceOf(SkillLoaderError);
    await expect(call).rejects.toMatchObject({
      message: expect.stringMatching(
        /does not match skill slug "a-different-slug"/,
      ),
    });
  });

  it("accepts arbitrary support files and subdirectories at the skill root", async () => {
    await writeSkill(workspace, "saudi/sample", {
      extraFiles: {
        "notes.txt": "stray-text",
        "assets/README.md": "assets",
        "templates/invoice.xml": "<xml/>",
      },
    });

    const [skill] = await loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    expect(skill.files.map((f) => f.path)).toEqual([
      "assets/README.md",
      "notes.txt",
      "templates/invoice.xml",
    ]);
  });

  it("rejects symbolic links to avoid packaging paths that escape the skill directory", async () => {
    const dir = await writeSkill(workspace, "saudi/sample", {});
    const linkTarget = path.join(workspace, "outside.md");
    await fs.writeFile(linkTarget, "escape", "utf8");
    await fs.symlink(linkTarget, path.join(dir, "escape.md"));

    const call = loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    await expect(call).rejects.toBeInstanceOf(SkillLoaderError);
    await expect(call).rejects.toMatchObject({
      message: expect.stringMatching(/Symbolic link "escape\.md"/),
    });
  });

  it("rejects a slug that is not kebab-case at the schema layer", async () => {
    await writeSkill(workspace, "saudi/Bad_Slug", {
      yaml: `id: saudi-bad
name: { en: Bad, ar: سيء }
slug: Bad_Slug
version: 0.1.0
category: compliance
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

    const call = loadSkillsFromDirectory({
      skillsRoot: path.join(workspace, "skills"),
      repoRoot: workspace,
    });

    await expect(call).rejects.toBeInstanceOf(SkillValidationError);
    await expect(call).rejects.toMatchObject({
      message: expect.stringContaining("slug must be kebab-case"),
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
