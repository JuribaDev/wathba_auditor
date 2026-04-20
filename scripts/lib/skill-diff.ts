import type { BumpLevel } from "./skill-bump";
import { stricterBump } from "./skill-bump";

export type SkillFile = { path: string; content: string };

export type SkillSnapshotInput = {
  id: string;
  slug: string;
  previousIds: readonly string[];
  version: string;
  category: string;
  region: string | null;
  status: string;
  disclaimer: boolean;
  lastVerified: string;
  name: { en: string; ar: string };
  summary?: { en: string; ar: string };
  maintainers: Array<{ github: string }>;
  sources: Array<{ title: string; url: string; accessed: string }>;
  targets: readonly string[];
  variables: Array<{
    name: string;
    label: { en: string; ar: string };
    type: string;
    options?: string[];
  }>;
  triggers: Array<{ when: Record<string, string | number | boolean | null> }>;
  body: string;
  references: readonly SkillFile[];
  scripts: readonly SkillFile[];
};

export type SkillChange = {
  kind: string;
  requires: BumpLevel;
  reason: string;
};

export type SkillDiffResult = {
  requiredBump: BumpLevel;
  changes: SkillChange[];
};

function filesByPath(files: readonly SkillFile[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of files) map.set(file.path, file.content);
  return map;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>).sort();
    const bKeys = Object.keys(b as Record<string, unknown>).sort();
    if (aKeys.length !== bKeys.length) return false;
    for (let i = 0; i < aKeys.length; i += 1) {
      if (aKeys[i] !== bKeys[i]) return false;
      const key = aKeys[i];
      if (
        !deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        )
      ) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function compareVariables(
  before: SkillSnapshotInput["variables"],
  after: SkillSnapshotInput["variables"],
): SkillChange[] {
  const changes: SkillChange[] = [];
  const oldByName = new Map(before.map((v) => [v.name, v]));
  const newByName = new Map(after.map((v) => [v.name, v]));

  for (const [name, prev] of oldByName) {
    const next = newByName.get(name);
    if (!next) {
      changes.push({
        kind: "variable-removed-or-renamed",
        requires: "major",
        reason: `Variable "${name}" was removed or renamed. Removing or renaming a variable breaks existing agent prompts that reference it.`,
      });
      continue;
    }
    if (prev.type !== next.type) {
      changes.push({
        kind: "variable-type-changed",
        requires: "major",
        reason: `Variable "${name}" type changed from "${prev.type}" to "${next.type}". Type changes are not backward compatible.`,
      });
    }
    const prevOpts = prev.options ?? [];
    const nextOpts = next.options ?? [];
    const removedOptions = prevOpts.filter((option) => !nextOpts.includes(option));
    if (removedOptions.length > 0) {
      changes.push({
        kind: "variable-option-removed",
        requires: "major",
        reason: `Variable "${name}" no longer offers option(s): ${removedOptions.join(", ")}. Removing options can break existing selections.`,
      });
    }
    const addedOptions = nextOpts.filter((option) => !prevOpts.includes(option));
    if (addedOptions.length > 0) {
      changes.push({
        kind: "variable-option-added",
        requires: "minor",
        reason: `Variable "${name}" gained option(s): ${addedOptions.join(", ")}.`,
      });
    }
    if (!deepEqual(prev.label, next.label)) {
      changes.push({
        kind: "variable-label-edited",
        requires: "patch",
        reason: `Variable "${name}" label text was edited.`,
      });
    }
  }

  for (const [name] of newByName) {
    if (!oldByName.has(name)) {
      changes.push({
        kind: "variable-added",
        requires: "minor",
        reason: `Variable "${name}" was added. Adding a variable is a backward-compatible extension.`,
      });
    }
  }

  return changes;
}

function compareTargets(
  before: readonly string[],
  after: readonly string[],
): SkillChange[] {
  const changes: SkillChange[] = [];
  const prev = new Set(before);
  const next = new Set(after);

  for (const target of prev) {
    if (!next.has(target)) {
      changes.push({
        kind: "target-removed",
        requires: "major",
        reason: `Target "${target}" was removed. Agents relying on this target will lose their installation path.`,
      });
    }
  }
  for (const target of next) {
    if (!prev.has(target)) {
      changes.push({
        kind: "target-added",
        requires: "minor",
        reason: `Target "${target}" was added. Installations for that agent become available.`,
      });
    }
  }
  return changes;
}

function compareFiles(
  kind: "references" | "scripts",
  before: readonly SkillFile[],
  after: readonly SkillFile[],
): SkillChange[] {
  const changes: SkillChange[] = [];
  const prevMap = filesByPath(before);
  const nextMap = filesByPath(after);

  for (const [path, content] of prevMap) {
    const nextContent = nextMap.get(path);
    if (nextContent === undefined) {
      changes.push({
        kind: `${kind}-removed`,
        requires: "minor",
        reason: `${kind}/${path} was removed.`,
      });
      continue;
    }
    if (nextContent !== content) {
      changes.push({
        kind: `${kind}-edited`,
        requires: "patch",
        reason: `${kind}/${path} content was edited.`,
      });
    }
  }
  for (const [path] of nextMap) {
    if (!prevMap.has(path)) {
      changes.push({
        kind: `${kind}-added`,
        requires: "minor",
        reason: `${kind}/${path} was added.`,
      });
    }
  }
  return changes;
}

export function classifySkillDiff(
  before: SkillSnapshotInput,
  after: SkillSnapshotInput,
): SkillDiffResult {
  const changes: SkillChange[] = [];

  if (before.id !== after.id) {
    changes.push({
      kind: "id-changed",
      requires: "major",
      reason: `Skill id changed from "${before.id}" to "${after.id}". The id is the stable consumer identifier — route paths and generated file keys depend on it.`,
    });
  }
  if (before.slug !== after.slug) {
    changes.push({
      kind: "slug-changed",
      requires: "major",
      reason: `Skill slug changed from "${before.slug}" to "${after.slug}". The slug is part of the generated file path for every target.`,
    });
  }
  if (before.category !== after.category) {
    changes.push({
      kind: "category-changed",
      requires: "major",
      reason: `Skill category changed from "${before.category}" to "${after.category}". Category gates compliance disclaimer rules and filter behavior.`,
    });
  }
  if (before.region !== after.region) {
    changes.push({
      kind: "region-changed",
      requires: "minor",
      reason: `Skill region changed from "${String(before.region)}" to "${String(after.region)}".`,
    });
  }

  changes.push(...compareTargets(before.targets, after.targets));
  changes.push(...compareVariables(before.variables, after.variables));
  changes.push(...compareFiles("references", before.references, after.references));
  changes.push(...compareFiles("scripts", before.scripts, after.scripts));

  if (before.body !== after.body) {
    changes.push({
      kind: "body-edited",
      requires: "patch",
      reason: "SKILL.md body content was edited.",
    });
  }
  if (!deepEqual(before.name, after.name)) {
    changes.push({
      kind: "name-edited",
      requires: "patch",
      reason: "Skill display name was edited.",
    });
  }
  if (!deepEqual(before.summary, after.summary)) {
    changes.push({
      kind: "summary-edited",
      requires: "patch",
      reason: "Skill summary text was edited.",
    });
  }
  if (!deepEqual(before.maintainers, after.maintainers)) {
    changes.push({
      kind: "maintainers-edited",
      requires: "patch",
      reason: "Maintainers list was edited.",
    });
  }
  if (before.status !== after.status) {
    changes.push({
      kind: "status-changed",
      requires: "patch",
      reason: `Skill status changed from "${before.status}" to "${after.status}".`,
    });
  }
  if (before.disclaimer !== after.disclaimer) {
    changes.push({
      kind: "disclaimer-toggled",
      requires: "patch",
      reason: `Disclaimer flag toggled from ${before.disclaimer} to ${after.disclaimer}.`,
    });
  }
  if (before.lastVerified !== after.lastVerified) {
    changes.push({
      kind: "last-verified-updated",
      requires: "patch",
      reason: `last_verified moved from "${before.lastVerified}" to "${after.lastVerified}".`,
    });
  }
  if (!deepEqual(before.sources, after.sources)) {
    changes.push({
      kind: "sources-edited",
      requires: "patch",
      reason: "Sources list (titles, URLs, or access dates) was edited.",
    });
  }
  if (!deepEqual(before.triggers, after.triggers)) {
    if (before.triggers.length !== after.triggers.length) {
      changes.push({
        kind: "triggers-changed",
        requires: "minor",
        reason: "Triggers list was expanded or shrunk, which affects recommendation matching.",
      });
    } else {
      changes.push({
        kind: "triggers-edited",
        requires: "patch",
        reason: "Trigger payload was edited without changing the trigger count.",
      });
    }
  }

  const requiredBump = changes.reduce<BumpLevel>(
    (acc, change) => stricterBump(acc, change.requires),
    "none",
  );

  return { requiredBump, changes };
}
