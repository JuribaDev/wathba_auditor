import type { GeneratedSkill } from "@/lib/skills/generated";

import {
  formatFrontmatterValue,
  type RenderedFile,
} from "@/lib/generate/adapters/claude-code";

// Cursor's durable, model-available context mechanism is `.cursor/rules/*.mdc`
// files with a small YAML frontmatter. Reference shape (as widely documented
// across Cursor 0.x and community skills repos):
//
//   ---
//   description: short agent-visible description
//   globs: <glob-or-blank>
//   alwaysApply: false
//   ---
//   <markdown body>
//
// We were unable to live-verify https://docs.cursor.com/en/context/rules via
// the build tools during generator development (docs site is an SPA). The
// shape below matches the stable public contract used by addyosmani/agent-skills
// and other Cursor-integrated tooling. If the official spec diverges, adjust
// here and update the companion tests in apps/web/tests/unit/.

const CURSOR_RULES_ROOT = ".cursor/rules";

const MAX_DESCRIPTION_LENGTH = 1024;

function clampDescription(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}

export function buildCursorRuleFrontmatter(options: {
  description: string;
  globs?: string;
  alwaysApply?: boolean;
}): string {
  const description = clampDescription(options.description);
  const lines = [
    "---",
    `description: ${formatFrontmatterValue(description)}`,
    `globs: ${options.globs ? formatFrontmatterValue(options.globs) : ""}`,
    `alwaysApply: ${options.alwaysApply === true ? "true" : "false"}`,
    "---",
  ];
  return lines.join("\n");
}

export function buildCursorRuleMarkdown(skill: GeneratedSkill): string {
  const description = skill.summary?.en ?? skill.name.en;
  const frontmatter = buildCursorRuleFrontmatter({
    description,
    alwaysApply: false,
  });
  const body = skill.body.replace(/\s+$/, "");
  const governance = `_Version: ${skill.version} · Last verified: ${skill.lastVerified} · Status: ${skill.status}_`;
  const sourceLines =
    skill.sources.length === 0
      ? ""
      : ["", "**Sources**", "", ...skill.sources.map((s) => `- [${s.title}](${s.url})`)].join("\n");
  const disclaimer = skill.disclaimer
    ? "\n\n> Engineering guidance, not legal advice. Verify each rule against the official sources below."
    : "";
  return `${frontmatter}\n\n${body}${disclaimer}\n\n${governance}${sourceLines}\n`;
}

export function renderCursorRulesFiles(
  skills: readonly GeneratedSkill[],
): RenderedFile[] {
  return skills.map((skill) => ({
    path: `${CURSOR_RULES_ROOT}/${skill.slug}.mdc`,
    encoding: "utf-8" as const,
    content: buildCursorRuleMarkdown(skill),
  }));
}

export function renderCursorRulesPaths(
  skills: readonly GeneratedSkill[],
): string[] {
  return renderCursorRulesFiles(skills).map((file) => file.path);
}
