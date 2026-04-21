import type { GeneratedSkill } from "@/lib/skills/generated";

import {
  bodyAlreadyHasGovernance,
  buildGovernanceFooter,
  formatFrontmatterValue,
  supportFileToRenderedFile,
  type RenderedFile,
} from "@/lib/generate/adapters/claude-code";
import type { SkillResolution } from "@/lib/generate/resolve-markdown";

// Cursor Agent Skills ship the same SKILL.md-plus-directory layout as the open Agent
// Skills standard (https://agentskills.io). They are NOT `.cursor/rules/*.mdc` — those
// are a separate Cursor Rules feature and must not leak into the skills export.
const CURSOR_ROOT = ".cursor/skills";

const MAX_DESCRIPTION_LENGTH = 1024;

function clampDescription(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}

export function buildCursorFrontmatter(options: {
  name: string;
  description: string;
}): string {
  const description = clampDescription(options.description);
  return [
    "---",
    `name: ${formatFrontmatterValue(options.name)}`,
    `description: ${formatFrontmatterValue(description)}`,
    "---",
  ].join("\n");
}

export function buildCursorSkillMarkdown(
  skill: GeneratedSkill,
  resolvedBody: string,
): string {
  const description = skill.summary?.en ?? skill.name.en;
  const frontmatter = buildCursorFrontmatter({
    name: skill.slug,
    description,
  });
  const body = resolvedBody.replace(/\s+$/, "");
  const sections: string[] = [frontmatter, body];
  const footer = buildGovernanceFooter(skill);
  if (footer && !bodyAlreadyHasGovernance(body)) {
    sections.push(footer);
  }
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
  const files: RenderedFile[] = [];
  for (const skill of skills) {
    const base = `${CURSOR_ROOT}/${skill.slug}`;
    const resolution = resolutionById.get(skill.id);
    const body = resolution ? resolution.body : skill.body;
    files.push({
      path: `${base}/SKILL.md`,
      encoding: "utf-8",
      content: buildCursorSkillMarkdown(skill, body),
    });
    for (const file of skill.files) {
      files.push(supportFileToRenderedFile(base, file));
    }
  }
  return files;
}

export function renderCursorPaths(skills: readonly GeneratedSkill[]): string[] {
  return renderCursorFiles(skills, []).map((file) => file.path);
}
