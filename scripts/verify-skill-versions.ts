import path from "node:path";

import {
  GitError,
  listChangedFiles,
  resolveBaseRef,
  repoRootFromCwd,
} from "./lib/git-utils";
import { loadSkillsFromDirectory } from "./lib/skill-loader";
import {
  indexSkillsAtRef,
  loadSkillSnapshotFromLoadedSkill,
} from "./lib/skill-snapshot";
import { classifyActualBump, rankBump } from "./lib/skill-bump";
import { classifySkillDiff } from "./lib/skill-diff";
import { findUnresolvedMigrations, pairSkills } from "./lib/skill-pairing";
import type { SkillSnapshotInput } from "./lib/skill-diff";

const REPO_ROOT = repoRootFromCwd(process.cwd());
const SKILLS_ROOT = path.join(REPO_ROOT, "skills");

type ChangedSkill = {
  directory: string;
  files: string[];
};

function groupChangedFilesBySkill(
  repoRoot: string,
  changedFiles: readonly string[],
): ChangedSkill[] {
  const grouped = new Map<string, string[]>();
  for (const file of changedFiles) {
    const normalized = file.replaceAll("\\", "/");
    if (!normalized.startsWith("skills/")) continue;
    const segments = normalized.split("/");
    if (segments.length < 4) continue;
    const skillDir = segments.slice(0, 3).join("/");
    const list = grouped.get(skillDir) ?? [];
    list.push(normalized);
    grouped.set(skillDir, list);
  }
  return Array.from(grouped.entries())
    .map(([directory, files]) => ({ directory, files: files.sort() }))
    .sort((a, b) => a.directory.localeCompare(b.directory));
}

async function main() {
  const override = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  const baseRef = resolveBaseRef(REPO_ROOT, override);
  if (!baseRef) {
    console.warn(
      "[verify:skills] No git base ref could be resolved (no origin/main, main, or WATHBA_BASE_REF). Skipping version enforcement.",
    );
    return;
  }

  let changedFiles: string[];
  try {
    changedFiles = listChangedFiles(REPO_ROOT, baseRef.ref);
  } catch (error) {
    if (error instanceof GitError) {
      console.error(
        `[verify:skills] Unable to diff against base ref "${baseRef.ref}" (${baseRef.source}):\n${error.stderr}`,
      );
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const changedSkills = groupChangedFilesBySkill(REPO_ROOT, changedFiles);
  if (changedSkills.length === 0) {
    console.log(
      `[verify:skills] No skill changes detected against base ${baseRef.ref} (${baseRef.source}).`,
    );
    return;
  }

  const loadedSkills = await loadSkillsFromDirectory({
    skillsRoot: SKILLS_ROOT,
    repoRoot: REPO_ROOT,
  });

  const currentByDirectory = new Map<string, SkillSnapshotInput>();
  const currentById = new Map<string, SkillSnapshotInput>();
  for (const skill of loadedSkills) {
    const dir = `skills/${skill.directory}`.replaceAll("\\", "/");
    const snapshot = loadSkillSnapshotFromLoadedSkill({
      ...skill,
      targets: skill.targets,
    });
    currentByDirectory.set(dir, snapshot);
    currentById.set(snapshot.id, snapshot);
  }

  // Index every skill that existed at baseRef by its stable id AND by its
  // original directory. The pairing layer uses both so it can detect
  // (a) in-place edits (same directory), (b) id changes at a stable
  // directory, (c) slug/folder renames, and (d) deletions.
  const oldIndexById = indexSkillsAtRef({
    cwd: REPO_ROOT,
    ref: baseRef.ref,
  });
  const oldByDirectory = new Map<string, SkillSnapshotInput>();
  const oldById = new Map<string, SkillSnapshotInput>();
  for (const [, entry] of oldIndexById) {
    oldByDirectory.set(entry.directory, entry.snapshot);
    oldById.set(entry.snapshot.id, entry.snapshot);
  }

  const filesByDirectory = new Map<string, string[]>(
    changedSkills.map((entry) => [entry.directory, entry.files]),
  );

  const pairs = pairSkills({
    changedDirectories: changedSkills.map((entry) => entry.directory),
    currentByDirectory,
    currentById,
    oldByDirectory,
    oldById,
  });

  const failures: string[] = [];
  const summary: string[] = [];

  const unresolved = findUnresolvedMigrations(pairs);
  if (unresolved) {
    const addedLines = unresolved.added.map(
      (entry) => `    + ${entry.id} (new)`,
    );
    const removedLines = unresolved.removed.map(
      (entry) => `    - ${entry.id} (removed)`,
    );
    failures.push(
      [
        `✖ Unresolved skill migration(s) — cannot verify version-bump policy.`,
        `  New skills in this PR:`,
        ...addedLines,
        `  Removed skills in this PR:`,
        ...removedLines,
        `  Governance cannot tell whether these are identity migrations`,
        `  (id + slug + body rewritten in one PR) or two independent changes.`,
        `  Resolve with ONE of:`,
        `    (a) For each new skill that replaces a removed one, add a`,
        `        "previous_id: [\"<old-id>\"]" field to the new skill's`,
        `        skill.yaml. Governance will then pair them and enforce`,
        `        the required major-version bump.`,
        `    (b) If the new and removed skills are unrelated, split them`,
        `        into separate PRs (see CONTRIBUTING → "When to split a`,
        `        pull request").`,
      ].join("\n"),
    );
  }

  for (const pair of pairs) {
    if (pair.kind === "removed") {
      summary.push(
        `· ${pair.old.id} — removed from the current tree (no version check needed).`,
      );
      continue;
    }
    if (pair.kind === "new") {
      summary.push(
        `· ${pair.current.id} — new skill, no version comparison needed (starts at ${pair.current.version}).`,
      );
      continue;
    }

    const { current, old, currentDirectory, oldDirectory, renamed, idChanged } = pair;
    const renameNote = renamed ? ` (renamed from ${oldDirectory})` : "";
    const idChangedNote = idChanged ? ` (id changed from ${old.id})` : "";
    const displayDir = `${currentDirectory}${renameNote}${idChangedNote}`;

    const files = [
      ...(filesByDirectory.get(currentDirectory) ?? []),
      ...(renamed ? (filesByDirectory.get(oldDirectory) ?? []) : []),
    ];

    const diff = classifySkillDiff(old, current);
    if (diff.requiredBump === "none") {
      summary.push(
        `· ${current.id} — changed files tracked, but no schema-visible edits detected.`,
      );
      continue;
    }

    const actualBump = classifyActualBump(old.version, current.version);
    if (actualBump === "invalid") {
      failures.push(
        [
          `✖ ${current.id} (${displayDir})`,
          `  version "${old.version}" or "${current.version}" is not a valid semver.`,
        ].join("\n"),
      );
      continue;
    }
    if (actualBump === "regressed") {
      failures.push(
        [
          `✖ ${current.id} (${displayDir})`,
          `  version went BACKWARDS: ${old.version} → ${current.version}.`,
          `  Fix: choose a version greater than ${old.version}.`,
        ].join("\n"),
      );
      continue;
    }

    const satisfied = rankBump(actualBump) >= rankBump(diff.requiredBump);
    const changeLines = diff.changes.map(
      (change) => `    - [${change.requires}] ${change.reason}`,
    );
    const fileLines = files.map((file) => `    - ${file}`);

    if (!satisfied) {
      failures.push(
        [
          `✖ ${current.id} (${displayDir})`,
          `  required bump : ${diff.requiredBump}`,
          `  actual bump   : ${actualBump}  (${old.version} → ${current.version})`,
          `  changed files :`,
          ...fileLines,
          `  detected changes:`,
          ...changeLines,
          `  Fix: bump "version" in ${currentDirectory}/skill.yaml to at least ${suggestNextVersion(old.version, diff.requiredBump)}.`,
        ].join("\n"),
      );
    } else {
      summary.push(
        `· ${current.id} — ${old.version} → ${current.version} (required ${diff.requiredBump}, got ${actualBump}).${renameNote}${idChangedNote} OK`,
      );
    }
  }

  if (summary.length > 0) {
    console.log(
      `[verify:skills] Base ref: ${baseRef.ref} (${baseRef.source})`,
    );
    for (const line of summary) console.log(line);
  }

  if (failures.length > 0) {
    console.error(
      `\n[verify:skills] ${failures.length} skill${failures.length === 1 ? "" : "s"} failed version-bump policy:\n`,
    );
    for (const failure of failures) console.error(`${failure}\n`);
    console.error(
      "See CONTRIBUTING.md → \"Skill versioning policy\" for the full bump matrix.",
    );
    process.exitCode = 1;
    return;
  }
  console.log(`[verify:skills] ${pairs.length} changed skill(s) passed version-bump policy.`);
}

function suggestNextVersion(
  previousVersion: string,
  requiredBump: string,
): string {
  const match = previousVersion.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return previousVersion;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (requiredBump === "major") return `${major + 1}.0.0`;
  if (requiredBump === "minor") return `${major}.${minor + 1}.0`;
  if (requiredBump === "patch") return `${major}.${minor}.${patch + 1}`;
  return previousVersion;
}

main().catch((error) => {
  console.error("[verify:skills] Unexpected failure:", error);
  process.exitCode = 1;
});
