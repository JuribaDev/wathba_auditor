import type { GeneratedSkill } from "@/lib/skills/generated";

import {
  bodyAlreadyHasGovernance,
  buildGovernanceFooter,
  formatFrontmatterValue,
  supportFileToRenderedFile,
  type RenderedFile,
} from "@/lib/generate/adapters/claude-code";
import type { SkillResolution } from "@/lib/generate/resolve-markdown";

// Codex Agent Skills live under $CWD/.agents/skills/<slug>/ per
// https://developers.openai.com/codex/skills#where-to-save-skills. The legacy
// AGENTS.md file is a *separate* feature (repository guidance, not a skill format) and
// must never be produced by this adapter.
const CODEX_ROOT = ".agents/skills";

const MAX_DESCRIPTION_LENGTH = 1024;

function clampDescription(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}

export function buildCodexFrontmatter(options: {
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

export function buildCodexSkillMarkdown(
  skill: GeneratedSkill,
  resolvedBody: string,
): string {
  const description = skill.summary?.en ?? skill.name.en;
  const frontmatter = buildCodexFrontmatter({
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

export function renderCodexFiles(
  skills: readonly GeneratedSkill[],
  resolutions: readonly SkillResolution[],
): RenderedFile[] {
  if (skills.length === 0) return [];
  const resolutionById = new Map(
    resolutions.map((resolution) => [resolution.skillId, resolution]),
  );
  const files: RenderedFile[] = [];
  for (const skill of skills) {
    const base = `${CODEX_ROOT}/${skill.slug}`;
    const resolution = resolutionById.get(skill.id);
    const body = resolution ? resolution.body : skill.body;
    files.push({
      path: `${base}/SKILL.md`,
      encoding: "utf-8",
      content: buildCodexSkillMarkdown(skill, body),
    });
    // Optional `agents/openai.yaml` and any other bundled files — including the docs-
    // sanctioned assets/, references/, scripts/ dirs — ship through as authored. We do
    // not fabricate openai.yaml when it is absent (the task spec forbids that).
    for (const file of skill.files) {
      files.push(supportFileToRenderedFile(base, file));
    }
  }
  return files;
}

export function renderCodexPaths(
  skills: readonly GeneratedSkill[],
): string[] {
  return renderCodexFiles(skills, []).map((file) => file.path);
}
