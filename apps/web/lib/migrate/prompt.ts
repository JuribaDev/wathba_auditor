import type { RenderedFile } from "@/lib/generate/adapters/claude-code";
import {
  chooseFence,
  detectLanguage,
  formatByteSize,
  type AgentPromptBundle,
} from "@/lib/generate/prompt";
import type { TargetAgent } from "@/lib/skills/recommendations";

export type MigrationSourceAgent = "claude-code";
export type MigrationTargetAgent = TargetAgent | "custom";
export type MigratorInstallTarget = Exclude<TargetAgent, "agents-md">;

export type MigrationPromptOptions = {
  source: MigrationSourceAgent;
  target: MigrationTargetAgent;
};

const MIGRATOR_INSTALL_TARGETS: readonly MigratorInstallTarget[] = [
  "codex",
  "claude-code",
  "cursor",
];

const TARGET_LABEL: Record<MigrationTargetAgent, string> = {
  "claude-code": "Claude Code",
  cursor: "Cursor",
  codex: "OpenAI Codex",
  "agents-md": "AGENTS.md-compatible agents",
  custom: "a custom AI coding agent",
};

const TARGET_PATHS: Record<MigrationTargetAgent, readonly string[]> = {
  "claude-code": [
    ".claude/skills/<slug>/SKILL.md",
    ".claude/commands/<command>.md",
    "plugins/<plugin>/",
  ],
  cursor: [
    ".cursor/skills/<slug>/SKILL.md",
    ".cursor/rules/<slug>.mdc",
  ],
  codex: [".agents/skills/<slug>/SKILL.md"],
  "agents-md": ["AGENTS.md"],
  custom: ["Ask the user for the target root, directory pattern, and entry file."],
};

const SOURCE_DISCOVERY_PATHS = [
  "CLAUDE.md",
  "CLAUDE.local.md",
  "**/CLAUDE.md",
  ".claude/skills/**/SKILL.md",
  ".claude/skills/**/references/**",
  ".claude/skills/**/scripts/**",
  ".claude/skills/**/assets/**",
  ".claude/commands/**/*.md",
  ".claude/settings.json",
  ".claude/settings.local.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  "plugins/**/plugin.json",
  "plugins/**/skills/**/SKILL.md",
  "plugins/**/commands/**/*.md",
  "plugins/**/docs/**/*.md",
  "plugins/**/skills/**/references/**",
  "plugins/**/skills/**/scripts/**",
  "plugins/**/skills/**/assets/**",
] as const;

function claudeCodeInstruction(target: MigrationTargetAgent): string[] {
  if (target !== "claude-code") return [];
  return [
    "Claude Code target rule: ask in the plan whether plugin-shaped source content should stay plugin-shaped under `plugins/<plugin>/` or be flattened into local `.claude/skills/` and `.claude/commands/` files.",
    "If source slash commands are still useful as Claude Code commands, preserve them as `.claude/commands/<command>.md` or plugin `commands/` files instead of converting them into ordinary skills.",
  ];
}

function agentsMdInstruction(target: MigrationTargetAgent): string[] {
  if (target !== "agents-md") return [];
  return [
    "AGENTS.md target rule: if `AGENTS.md` already exists, do not overwrite it. Merge migrated Claude guidance as clearly named sections and leave unrelated existing sections untouched.",
    "If source `CLAUDE.md` files exist, treat them as project instruction inputs for the AGENTS.md merge, not as standalone skills.",
  ];
}

function customTargetInstruction(target: MigrationTargetAgent): string[] {
  if (target !== "custom") return [];
  return [
    "Custom target rule: before creating the migration plan, ask the user for the target agent's expected root path, directory pattern, entry filename, frontmatter requirements, and support-file behavior if those details are not already provided.",
    "After the user supplies that target contract, produce the normal migration plan and wait for approval before writing files.",
  ];
}

function codexSkillCreatorInstruction(target: MigrationTargetAgent): string[] {
  if (target !== "codex") return [];
  return [
    "Codex target rule: use the Codex `skill-creator` skill/workflow before writing target skills when it is available. Use it to shape each migrated skill into a valid Codex Agent Skill, then write the final files under `.agents/skills/<slug>/`.",
    "If `skill-creator` is not available in the current agent environment, say so in the plan and follow the Codex Agent Skills structure directly.",
  ];
}

export function buildMigrationPrompt(options: MigrationPromptOptions): string {
  const targetName = TARGET_LABEL[options.target];
  const targetPaths = TARGET_PATHS[options.target]
    .map((path) => `- ${path}`)
    .join("\n");
  const claudeRules = claudeCodeInstruction(options.target);
  const codexRules = codexSkillCreatorInstruction(options.target);
  const agentsMdRules = agentsMdInstruction(options.target);
  const customRules = customTargetInstruction(options.target);
  const targetRules = [
    ...claudeRules,
    ...codexRules,
    ...agentsMdRules,
    ...customRules,
  ];

  const sections = [
    "# Skill migration request",
    "",
    `Source: Claude Code skills, commands, and plugins.`,
    `Target: ${targetName}.`,
    "",
    "You are migrating AI coding-agent skills in this repository. Work repo-locally. Do not ask the user to upload files elsewhere.",
    "",
    "## Approval gate",
    "",
    "Do not create, edit, move, or delete files before the user approves your migration plan. Your first response must be a plan only, except when the target is custom and the target contract is missing. In that case, ask only for the missing target contract first, then produce the plan after the user answers.",
    "",
    "## Discover source files",
    "",
    "Inspect the repository for these Claude Code inputs:",
    "",
    ...SOURCE_DISCOVERY_PATHS.map((path) => `- ${path}`),
    "",
    "Classify each discovered item as one of:",
    "",
    "- portable skill",
    "- Claude-specific skill",
    "- Claude command workflow",
    "- Claude plugin package",
    "- Claude project instruction",
    "- Claude settings/context file",
    "- support file",
    "- unsupported or ambiguous item",
    "",
    "## Plan format",
    "",
    "Return a migration plan with:",
    "",
    "- discovered source files",
    "- proposed target files",
    "- how every Claude skill, command, plugin skill, plugin command, project instruction, settings file, doc, reference, script, and asset will be handled",
    "- content changes needed for the target agent",
    "- risks or assumptions",
    "- validation commands you will run after writing files",
    "- explicit approval question at the end",
    "",
    "## Target output",
    "",
    "Use these target paths:",
    "",
    targetPaths,
    "",
    ...targetRules,
    ...(targetRules.length > 0 ? [""] : []),
    "## Conversion rules",
    "",
    "- Preserve the user's source files unless the user explicitly asks you to remove them.",
    "- Preserve support files losslessly when the target format supports skill directories.",
    "- Convert Claude commands into target-native skill workflows or AGENTS.md sections; do not pretend slash commands exist in agents that do not support them.",
    "- Treat CLAUDE.md files and Claude settings as migration context. Convert durable project guidance into the target's repository-instruction format when appropriate, and do not copy local-only or machine-specific settings blindly.",
    "- For Claude plugins, inspect `plugin.json` and migrate contained skills, commands, docs, references, scripts, and assets. Do not recreate Claude marketplace metadata unless the target is Claude Code.",
    "- Keep frontmatter minimal and target-native. For Codex and Claude Code skills, use `name` and `description` frontmatter and put extra provenance in markdown body text.",
    "- Use safe relative paths only. Reject paths with absolute roots, drive letters, null bytes, or `..` segments.",
    "- If two source skills map to the same slug, stop and ask the user how to resolve the collision.",
    "",
    "## After approval",
    "",
    "After the user approves the plan, write the files, run the proposed validation, then summarize:",
    "",
    "- files created or changed",
    "- source files left untouched",
    "- warnings that remain",
    "- commands/tests that passed or could not run",
  ];

  return `${sections.join("\n")}\n`;
}

function buildMigratorSkillMarkdown(options: MigrationPromptOptions): string {
  const body = buildMigrationPrompt(options).trimEnd();
  return [
    "---",
    "name: skill-migrator",
    `description: Migrate Claude Code skills, commands, and plugins to ${TARGET_LABEL[options.target]} with a plan-first approval gate.`,
    "---",
    "",
    "# Skill Migrator",
    "",
    "Use this skill when the user asks to migrate AI coding-agent skills from Claude Code into another coding-agent format.",
    "",
    body,
    "",
  ].join("\n");
}

function buildCursorRuleMarkdown(options: MigrationPromptOptions): string {
  return [
    "---",
    "description: Migrate Claude Code skills, commands, and plugins with user approval before edits",
    "globs:",
    '  - ".claude/**"',
    '  - "plugins/**"',
    "alwaysApply: false",
    "---",
    "",
    buildMigratorSkillMarkdown(options).trimEnd(),
    "",
  ].join("\n");
}

export function renderMigratorSkillFiles(
  installTarget: MigratorInstallTarget,
  options: MigrationPromptOptions,
): RenderedFile[] {
  const markdown = buildMigratorSkillMarkdown(options);
  switch (installTarget) {
    case "codex":
      return [
        {
          path: ".agents/skills/skill-migrator/SKILL.md",
          encoding: "utf-8",
          content: markdown,
        },
      ];
    case "claude-code":
      return [
        {
          path: ".claude/skills/skill-migrator/SKILL.md",
          encoding: "utf-8",
          content: markdown,
        },
      ];
    case "cursor":
      return [
        {
          path: ".cursor/skills/skill-migrator/SKILL.md",
          encoding: "utf-8",
          content: markdown,
        },
        {
          path: ".cursor/rules/skill-migrator.mdc",
          encoding: "utf-8",
          content: buildCursorRuleMarkdown(options),
        },
      ];
  }
}

function renderFileBlock(file: RenderedFile, index: number, total: number): string {
  const header = `### File ${index + 1} / ${total}: \`${file.path}\``;
  const fence = chooseFence(file.content);
  const language = detectLanguage(file.path);
  const trimmed = file.content.endsWith("\n")
    ? file.content.slice(0, -1)
    : file.content;
  return [header, "", `${fence}${language}`, trimmed, fence].join("\n");
}

export function buildMigratorInstallPrompt(
  installTarget: MigratorInstallTarget,
  options: MigrationPromptOptions,
): AgentPromptBundle {
  const files = renderMigratorSkillFiles(installTarget, options);
  const fileBlocks = files.map((file, index) =>
    renderFileBlock(file, index, files.length),
  );
  const text = [
    "# Install the Skill Migrator",
    "",
    "Create the files below exactly as shown, relative to the repository root.",
    "After writing them, tell the user which migrator skill path was installed and that future migrations must still start with a plan for approval.",
    "",
    "## Files",
    "",
    ...fileBlocks,
    "",
  ].join("\n");
  const byteSize =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(text).length
      : text.length;

  return {
    target: installTarget,
    text,
    fileCount: files.length,
    byteSize,
    binaryFileCount: 0,
  };
}

export function buildMigratorInstallPrompts(
  options: MigrationPromptOptions,
): AgentPromptBundle[] {
  return MIGRATOR_INSTALL_TARGETS.map((target) =>
    buildMigratorInstallPrompt(target, options),
  );
}

export function describeMigratorPromptSize(text: string): string {
  const byteSize =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(text).length
      : text.length;
  return formatByteSize(byteSize);
}
