import type { GeneratedSkill, SkillFile } from "@/lib/skills/generated";

import type { SkillResolution } from "@/lib/generate/resolve-markdown";

export type RenderedFile = {
  path: string;
  encoding: "utf-8" | "base64";
  content: string;
};

const CLAUDE_ROOT = ".claude/skills";

// Skill description must fit into docs-native frontmatter unchanged; clamp defensively
// to the Agent Skills spec limit so we never emit a SKILL.md that would fail validation
// in a strict client.
const MAX_DESCRIPTION_LENGTH = 1024;

function escapeDoubleQuoted(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isYamlSafeScalar(value: string): boolean {
  // Quote whenever the value could be misparsed: YAML indicators, leading/trailing
  // whitespace, empty string, things that look like booleans/null/numbers.
  if (value.length === 0) return false;
  if (/^\s|\s$/.test(value)) return false;
  if (/[:#&*!|>'"%@`,{}\[\]?]/.test(value)) return false;
  if (/^-/.test(value)) return false;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(value)) return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return false;
  return true;
}

export function formatFrontmatterValue(value: string): string {
  if (isYamlSafeScalar(value)) return value;
  return `"${escapeDoubleQuoted(value)}"`;
}

function clampDescription(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}

export type ClaudeFrontmatterOptions = {
  name: string;
  description: string;
};

export function buildClaudeFrontmatter(
  options: ClaudeFrontmatterOptions,
): string {
  const description = clampDescription(options.description);
  return [
    "---",
    `name: ${formatFrontmatterValue(options.name)}`,
    `description: ${formatFrontmatterValue(description)}`,
    "---",
  ].join("\n");
}

// Governance/provenance data we want visible in the exported SKILL.md but not wedged into
// undocumented frontmatter fields. Claude Code does not reserve these keys in its
// frontmatter reference, so we express them as a markdown footer instead.
export function buildGovernanceFooter(skill: GeneratedSkill): string | null {
  const lines: string[] = [];
  const meta = `_Version: ${skill.version} · Last verified: ${skill.lastVerified} · Status: ${skill.status}_`;
  lines.push(meta);
  if (skill.disclaimer) {
    lines.push(
      "> Engineering guidance, not legal advice. Verify each rule against the official sources below.",
    );
  }
  if (skill.sources.length > 0) {
    const sourceLines = skill.sources.map(
      (source) => `- [${source.title}](${source.url})`,
    );
    lines.push(["**Sources**", "", ...sourceLines].join("\n"));
  }
  return lines.length === 0 ? null : lines.join("\n\n");
}

// Cheap detection: if the rendered body already carries a version/sources block we assume
// the author handled it intentionally and do not duplicate. Keeps the exported file from
// growing a double disclaimer when authors add their own.
const BODY_SIGNALS: readonly RegExp[] = [
  /^\s*_Version:/m,
  /^\s*\*\*Sources\*\*/m,
  /^\s*_Sources:_/m,
];

export function bodyAlreadyHasGovernance(body: string): boolean {
  return BODY_SIGNALS.some((pattern) => pattern.test(body));
}

export function buildSkillMarkdown(
  skill: GeneratedSkill,
  resolvedBody: string,
): string {
  const description = skill.summary?.en ?? skill.name.en;
  const frontmatter = buildClaudeFrontmatter({ name: skill.slug, description });
  const body = resolvedBody.replace(/\s+$/, "");
  const sections: string[] = [frontmatter, body];
  const footer = buildGovernanceFooter(skill);
  if (footer && !bodyAlreadyHasGovernance(body)) {
    sections.push(footer);
  }
  return `${sections.join("\n\n")}\n`;
}

export function supportFileToRenderedFile(
  baseDir: string,
  file: SkillFile,
): RenderedFile {
  return {
    path: `${baseDir}/${file.path}`,
    encoding: file.encoding,
    content: file.content,
  };
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
      encoding: "utf-8",
      content: buildSkillMarkdown(skill, body),
    });
    for (const file of skill.files) {
      files.push(supportFileToRenderedFile(base, file));
    }
  }
  return files;
}

export function renderClaudeCodePaths(
  skills: readonly GeneratedSkill[],
): string[] {
  return renderClaudeCodeFiles(skills, []).map((file) => file.path);
}
