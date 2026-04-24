import { describe, expect, it } from "vitest";

import {
  buildMigrationPrompt,
  buildMigratorInstallPrompt,
  renderMigratorSkillFiles,
} from "@/lib/migrate/prompt";

describe("buildMigrationPrompt", () => {
  it("defaults the migration contract to plan-first approval", () => {
    const prompt = buildMigrationPrompt({
      source: "claude-code",
      target: "cursor",
    });

    expect(prompt).toContain("Do not create, edit, move, or delete files");
    expect(prompt).toContain("before the user approves your migration plan");
    expect(prompt).toContain("Your first response must be a plan only");
    expect(prompt).toContain("except when the target is custom");
  });

  it("covers Claude Code skills, commands, and plugins as source inputs", () => {
    const prompt = buildMigrationPrompt({
      source: "claude-code",
      target: "codex",
    });

    expect(prompt).toContain(".claude/skills/**/SKILL.md");
    expect(prompt).toContain(".claude/commands/**/*.md");
    expect(prompt).toContain("CLAUDE.md");
    expect(prompt).toContain(".claude/settings.json");
    expect(prompt).toContain(".claude-plugin/plugin.json");
    expect(prompt).toContain("plugins/**/plugin.json");
    expect(prompt).toContain("plugins/**/docs/**/*.md");
    expect(prompt).toContain("plugins/**/skills/**/assets/**");
    expect(prompt).toContain("Claude plugin package");
    expect(prompt).toContain("Claude project instruction");
    expect(prompt).toContain("Claude settings/context file");
  });

  it("requires Codex migrations to use skill-creator when available", () => {
    const codex = buildMigrationPrompt({
      source: "claude-code",
      target: "codex",
    });
    const cursor = buildMigrationPrompt({
      source: "claude-code",
      target: "cursor",
    });

    expect(codex).toContain("use the Codex `skill-creator` skill/workflow");
    expect(codex).toContain(".agents/skills/<slug>/");
    expect(cursor).not.toContain("skill-creator");
  });

  it("adds AGENTS.md merge rules only for the generic target", () => {
    const generic = buildMigrationPrompt({
      source: "claude-code",
      target: "agents-md",
    });
    const codex = buildMigrationPrompt({
      source: "claude-code",
      target: "codex",
    });

    expect(generic).toContain("if `AGENTS.md` already exists, do not overwrite it");
    expect(generic).toContain("leave unrelated existing sections untouched");
    expect(codex).not.toContain("if `AGENTS.md` already exists");
  });

  it("asks for a target contract before planning custom-agent migrations", () => {
    const prompt = buildMigrationPrompt({
      source: "claude-code",
      target: "custom",
    });

    expect(prompt).toContain("ask the user for the target agent's expected root path");
    expect(prompt).toContain("frontmatter requirements");
    expect(prompt).toContain("After the user supplies that target contract");
  });

  it("preserves Claude Code commands and plugin shape when Claude is the target", () => {
    const prompt = buildMigrationPrompt({
      source: "claude-code",
      target: "claude-code",
    });

    expect(prompt).toContain(".claude/commands/<command>.md");
    expect(prompt).toContain("plugins/<plugin>/");
    expect(prompt).toContain("should stay plugin-shaped");
    expect(prompt).toContain("preserve them as `.claude/commands/<command>.md`");
  });
});

describe("renderMigratorSkillFiles", () => {
  it("renders a reusable Codex skill under .agents/skills", () => {
    const files = renderMigratorSkillFiles("codex", {
      source: "claude-code",
      target: "codex",
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe(".agents/skills/skill-migrator/SKILL.md");
    expect(files[0].content).toContain("name: skill-migrator");
    expect(files[0].content).toContain("skill-creator");
  });

  it("renders Cursor skill and rule files", () => {
    const files = renderMigratorSkillFiles("cursor", {
      source: "claude-code",
      target: "agents-md",
    });

    expect(files.map((file) => file.path)).toEqual([
      ".cursor/skills/skill-migrator/SKILL.md",
      ".cursor/rules/skill-migrator.mdc",
    ]);
  });
});

describe("buildMigratorInstallPrompt", () => {
  it("embeds installable migrator files in an agent prompt", () => {
    const bundle = buildMigratorInstallPrompt("claude-code", {
      source: "claude-code",
      target: "codex",
    });

    expect(bundle.target).toBe("claude-code");
    expect(bundle.fileCount).toBe(1);
    expect(bundle.text).toContain(".claude/skills/skill-migrator/SKILL.md");
    expect(bundle.text).toContain("```markdown");
  });
});
