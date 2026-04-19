import type { ReviewSelections } from "@/components/questionnaire/step-review";
import { renderClaudeCodePaths } from "@/lib/generate/adapters/claude-code";
import { renderCursorPaths } from "@/lib/generate/adapters/cursor";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";

export const TARGET_AGENT_ORDER: readonly TargetAgent[] = [
  "claude-code",
  "cursor",
  "codex",
  "agents-md",
];

export type TargetFilePlan = {
  target: TargetAgent;
  files: string[];
  groups: DirectoryGroup[];
};

export type DirectoryGroup = {
  directory: string;
  files: string[];
};

export type FilePlan = {
  targets: TargetFilePlan[];
  totalFiles: number;
  skillCount: number;
};

export function getActiveSkills(
  catalog: readonly GeneratedSkill[],
  selections: ReviewSelections,
): GeneratedSkill[] {
  return catalog.filter((skill) => selections[skill.id]?.on === true);
}

export function orderTargets(
  agents: readonly TargetAgent[] | undefined,
): TargetAgent[] {
  if (!agents || agents.length === 0) return [];
  const set = new Set(agents);
  return TARGET_AGENT_ORDER.filter((agent) => set.has(agent));
}

export function buildFilesForTarget(
  target: TargetAgent,
  skills: readonly GeneratedSkill[],
): string[] {
  if (skills.length === 0) return [];
  switch (target) {
    case "claude-code":
      return renderClaudeCodePaths(skills);
    case "cursor":
      return renderCursorPaths(skills);
    case "codex":
    case "agents-md":
      return ["AGENTS.md"];
  }
}

export function groupFilesByDirectory(files: readonly string[]): DirectoryGroup[] {
  const grouped = new Map<string, string[]>();
  const order: string[] = [];
  for (const file of files) {
    const parts = file.split("/");
    const directory = parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
    const name = parts[parts.length - 1];
    if (!grouped.has(directory)) {
      grouped.set(directory, []);
      order.push(directory);
    }
    grouped.get(directory)!.push(name);
  }
  return order.map((directory) => ({
    directory,
    files: grouped.get(directory)!,
  }));
}

export function buildFilePlan(
  agents: readonly TargetAgent[] | undefined,
  skills: readonly GeneratedSkill[],
): FilePlan {
  const orderedAgents = orderTargets(agents);
  const targets: TargetFilePlan[] = orderedAgents.map((target) => {
    const files = buildFilesForTarget(target, skills);
    return {
      target,
      files,
      groups: groupFilesByDirectory(files),
    };
  });
  const totalFiles = targets.reduce(
    (count, target) => count + target.files.length,
    0,
  );
  return {
    targets,
    totalFiles,
    skillCount: skills.length,
  };
}
