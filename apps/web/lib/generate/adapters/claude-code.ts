import type { GeneratedSkill } from "@/lib/skills/generated";

import type { SkillResolution } from "@/lib/generate/resolve-markdown";

export type RenderedFile = {
  path: string;
  content: string;
};

const CLAUDE_ROOT = ".claude/skills";

function escapeFrontmatterValue(value: string): string {
  const needsQuoting = /[:#\-?&*!|>'"%@`,{}\[\]]/.test(value) || /^\s|\s$/.test(value);
  if (!needsQuoting) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function buildFrontmatter(
  skill: GeneratedSkill,
  descriptionEn: string,
): string {
  const lines = [
    "---",
    `name: ${skill.slug}`,
    `description: ${escapeFrontmatterValue(descriptionEn)}`,
    `version: ${skill.version}`,
    `status: ${skill.status}`,
    `last_verified: ${escapeFrontmatterValue(skill.lastVerified)}`,
  ];
  if (skill.disclaimer) {
    lines.push("disclaimer: true");
  }
  lines.push("---");
  return lines.join("\n");
}

function buildSkillMarkdown(
  skill: GeneratedSkill,
  resolvedBody: string,
): string {
  const description = skill.summary?.en ?? skill.name.en;
  const frontmatter = buildFrontmatter(skill, description);
  const body = resolvedBody.replace(/\s+$/, "");
  return `${frontmatter}\n\n${body}\n`;
}

export function renderClaudeCodeFiles(
  skills: readonly GeneratedSkill[],
  resolutions: readonly SkillResolution[],
): RenderedFile[] {
  if (skills.length === 0) return [];
  const resolutionById = new Map(
    resolutions.map((resolution) => [resolution.skillId, resolution]),
  );
  const files: RenderedFile[] = [];
  for (const skill of skills) {
    const base = `${CLAUDE_ROOT}/${skill.slug}`;
    const resolution = resolutionById.get(skill.id);
    const body = resolution ? resolution.body : skill.body;
    files.push({
      path: `${base}/SKILL.md`,
      content: buildSkillMarkdown(skill, body),
    });
    for (const reference of skill.references) {
      files.push({
        path: `${base}/references/${reference.path}`,
        content: reference.content,
      });
    }
    for (const script of skill.scripts) {
      files.push({
        path: `${base}/scripts/${script.path}`,
        content: script.content,
      });
    }
  }
  return files;
}

export function renderClaudeCodePaths(
  skills: readonly GeneratedSkill[],
): string[] {
  return renderClaudeCodeFiles(skills, []).map((file) => file.path);
}
