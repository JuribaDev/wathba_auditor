// Plugin dist build helpers.
//
// Canonical authoring stays under `skills/<category>/<slug>/` and feeds
// `apps/web/lib/skills/generated.ts`. This module consumes that generated
// structure and reshapes it into the Claude Code plugin contract documented at
// https://code.claude.com/docs/en/plugins-reference and
// https://code.claude.com/docs/en/plugin-marketplaces.
//
// Contract (verified against live docs):
//   - `.claude-plugin/plugin.json` — optional manifest; required if we want to
//     override name/description/metadata or pin commands paths. Plugin components
//     live at plugin-root/skills/<slug>/SKILL.md and plugin-root/commands/*.md.
//   - `.claude-plugin/marketplace.json` — catalog. Plugin `source` strings using
//     relative paths MUST start with "./" and resolve from the marketplace root.
//   - Skill dirs flattened to `skills/<slug>/...` (category prefix dropped), and
//     slugs are validated to be globally unique.

import { promises as fs } from "node:fs";
import path from "node:path";

import type { GeneratedSkill } from "../../apps/web/lib/skills/generated";

export const MAX_DESCRIPTION_LENGTH = 1024;

function escapeDoubleQuoted(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isYamlSafeScalar(value: string): boolean {
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

export function clampDescription(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}

export function buildSkillMarkdown(skill: GeneratedSkill): string {
  const description = skill.summary?.en ?? skill.name.en;
  const frontmatter = [
    "---",
    `name: ${formatFrontmatterValue(skill.slug)}`,
    `description: ${formatFrontmatterValue(clampDescription(description))}`,
    "---",
  ].join("\n");
  const body = skill.body.replace(/\s+$/, "");
  const footer = buildGovernanceFooter(skill);
  const sections = [frontmatter, body];
  if (footer && !bodyAlreadyHasGovernance(body)) sections.push(footer);
  return `${sections.join("\n\n")}\n`;
}

function buildGovernanceFooter(skill: GeneratedSkill): string | null {
  const lines: string[] = [];
  lines.push(
    `_Version: ${skill.version} · Last verified: ${skill.lastVerified} · Status: ${skill.status}_`,
  );
  if (skill.disclaimer) {
    lines.push(
      "> Engineering guidance, not legal advice. Verify each rule against the official sources below.",
    );
  }
  if (skill.sources.length > 0) {
    const sourceLines = skill.sources.map((s) => `- [${s.title}](${s.url})`);
    lines.push(["**Sources**", "", ...sourceLines].join("\n"));
  }
  return lines.length === 0 ? null : lines.join("\n\n");
}

const BODY_SIGNALS: readonly RegExp[] = [
  /^\s*_Version:/m,
  /^\s*\*\*Sources\*\*/m,
  /^\s*_Sources:_/m,
];

function bodyAlreadyHasGovernance(body: string): boolean {
  return BODY_SIGNALS.some((p) => p.test(body));
}

export type SlugCollision = { slug: string; skillIds: string[] };

export function findSlugCollisions(
  skills: readonly GeneratedSkill[],
): SlugCollision[] {
  const bySlug = new Map<string, string[]>();
  for (const skill of skills) {
    const ids = bySlug.get(skill.slug) ?? [];
    ids.push(skill.id);
    bySlug.set(skill.slug, ids);
  }
  return [...bySlug.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([slug, skillIds]) => ({ slug, skillIds }));
}

export type EmittedFile = {
  path: string;
  encoding: "utf-8" | "base64";
  content: string;
};

// Emit a skill under a plugin's `skills/<slug>/` directory. Supporting files
// (references/, scripts/, assets/) ride along at the same base.
export function renderPluginSkill(skill: GeneratedSkill): EmittedFile[] {
  const base = `skills/${skill.slug}`;
  const files: EmittedFile[] = [
    {
      path: `${base}/SKILL.md`,
      encoding: "utf-8",
      content: buildSkillMarkdown(skill),
    },
  ];
  for (const file of skill.files) {
    files.push({
      path: `${base}/${file.path}`,
      encoding: file.encoding,
      content: file.content,
    });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function writeEmittedFiles(
  rootDir: string,
  files: readonly EmittedFile[],
): Promise<void> {
  for (const file of files) {
    const abs = path.join(rootDir, file.path);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    if (file.encoding === "base64") {
      await fs.writeFile(abs, Buffer.from(file.content, "base64"));
    } else {
      await fs.writeFile(abs, file.content, "utf8");
    }
  }
}

// Clear previously-emitted generated tree so stale files don't linger when a
// skill is renamed or removed. Guarded by a marker file so we never blow away
// a directory we didn't own.
export async function clearGeneratedTree(rootDir: string): Promise<void> {
  try {
    const marker = path.join(rootDir, ".generated");
    await fs.access(marker);
  } catch {
    return;
  }
  await fs.rm(rootDir, { recursive: true, force: true });
}

export async function writeGeneratedMarker(rootDir: string): Promise<void> {
  await fs.writeFile(
    path.join(rootDir, ".generated"),
    "This directory is generated by scripts/generate-plugin-dist.ts. Do not edit by hand.\n",
    "utf8",
  );
}

// Deterministic JSON: sorted keys, 2-space indent, trailing newline.
export function stableStringify(value: unknown): string {
  const serialized = JSON.stringify(value, sortedReplacer, 2);
  return `${serialized}\n`;
}

function sortedReplacer(_key: string, value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value;
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return Object.fromEntries(entries);
}
