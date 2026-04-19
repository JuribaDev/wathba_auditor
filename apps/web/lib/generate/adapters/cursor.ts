import type { GeneratedSkill } from "@/lib/skills/generated";

import type { RenderedFile } from "@/lib/generate/adapters/claude-code";
import type { SkillResolution } from "@/lib/generate/resolve-markdown";

const CURSOR_ROOT = ".cursor/rules";

function escapeFrontmatterValue(value: string): string {
  const needsQuoting =
    /[:#\-?&*!|>'"%@`,{}\[\]]/.test(value) || /^\s|\s$/.test(value);
  if (!needsQuoting) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function buildFrontmatter(description: string): string {
  return [
    "---",
    `description: ${escapeFrontmatterValue(description)}`,
    "globs:",
    "alwaysApply: true",
    "---",
  ].join("\n");
}

function buildReadOnlyNote(skill: GeneratedSkill): string | null {
  const assetLines: string[] = [];
  if (skill.references.length > 0) {
    assetLines.push(
      `- References: ${skill.references.map((r) => r.path).join(", ")}`,
    );
  }
  if (skill.scripts.length > 0) {
    assetLines.push(
      `- Helper scripts (read-only in Cursor): ${skill.scripts
        .map((s) => s.path)
        .join(", ")}`,
    );
  }
  if (assetLines.length === 0) return null;
  return [
    "## Read-only assets",
    "",
    "Cursor rules cannot execute helpers. Use these as reference only:",
    "",
    ...assetLines,
  ].join("\n");
}

function buildCursorMarkdown(
  skill: GeneratedSkill,
  resolvedBody: string,
): string {
  const description = skill.summary?.en ?? skill.name.en;
  const frontmatter = buildFrontmatter(description);
  const body = resolvedBody.replace(/\s+$/, "");
  const note = buildReadOnlyNote(skill);
  const sections = [frontmatter, body];
  if (note) sections.push(note);
  return `${sections.join("\n\n")}\n`;
}

export function renderCursorFiles(
  skills: readonly GeneratedSkill[],
  resolutions: readonly SkillResolution[],
): RenderedFile[] {
  if (skills.length === 0) return [];
  const resolutionById = new Map(
    resolutions.map((resolution) => [resolution.skillId, resolution]),
  );
  return skills.map((skill) => {
    const resolution = resolutionById.get(skill.id);
    const body = resolution ? resolution.body : skill.body;
    return {
      path: `${CURSOR_ROOT}/${skill.slug}.mdc`,
      content: buildCursorMarkdown(skill, body),
    };
  });
}

export function renderCursorPaths(skills: readonly GeneratedSkill[]): string[] {
  return renderCursorFiles(skills, []).map((file) => file.path);
}
