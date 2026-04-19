import path from "node:path";

import {
  GitError,
  listChangedFiles,
  resolveBaseRef,
  repoRootFromCwd,
} from "./lib/git-utils";
import { loadSkillsFromDirectory } from "./lib/skill-loader";
import {
  loadSkillSnapshotAtRef,
  loadSkillSnapshotFromLoadedSkill,
} from "./lib/skill-snapshot";
import { classifyActualBump, rankBump } from "./lib/skill-bump";
import { classifySkillDiff } from "./lib/skill-diff";

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
  const loadedByDirectory = new Map<string, (typeof loadedSkills)[number]>();
  for (const skill of loadedSkills) {
    loadedByDirectory.set(`skills/${skill.directory}`.replaceAll("\\", "/"), skill);
  }

  const failures: string[] = [];
  const summary: string[] = [];

  for (const changedSkill of changedSkills) {
    const current = loadedByDirectory.get(changedSkill.directory);
    if (!current) {
      summary.push(
        `· ${changedSkill.directory} — removed or relocated (no version check needed).`,
      );
      continue;
    }

    const newSnapshot = loadSkillSnapshotFromLoadedSkill({
      ...current,
      targets: current.targets,
    });

    const oldSnapshot = loadSkillSnapshotAtRef(
      { cwd: REPO_ROOT, ref: baseRef.ref },
      changedSkill.directory,
    );

    if (!oldSnapshot) {
      summary.push(
        `· ${current.id} — new skill, no version comparison needed (starts at ${current.version}).`,
      );
      continue;
    }

    const diff = classifySkillDiff(oldSnapshot, newSnapshot);
    if (diff.requiredBump === "none") {
      summary.push(
        `· ${current.id} — changed files tracked, but no schema-visible edits detected.`,
      );
      continue;
    }

    const actualBump = classifyActualBump(oldSnapshot.version, newSnapshot.version);
    if (actualBump === "invalid") {
      failures.push(
        [
          `✖ ${current.id} (${changedSkill.directory})`,
          `  version "${oldSnapshot.version}" or "${newSnapshot.version}" is not a valid semver core.`,
        ].join("\n"),
      );
      continue;
    }
    if (actualBump === "regressed") {
      failures.push(
        [
          `✖ ${current.id} (${changedSkill.directory})`,
          `  version went BACKWARDS: ${oldSnapshot.version} → ${newSnapshot.version}.`,
          `  Fix: choose a version greater than ${oldSnapshot.version}.`,
        ].join("\n"),
      );
      continue;
    }

    const satisfied = rankBump(actualBump) >= rankBump(diff.requiredBump);
    const changeLines = diff.changes.map(
      (change) => `    - [${change.requires}] ${change.reason}`,
    );
    const fileLines = changedSkill.files.map((file) => `    - ${file}`);

    if (!satisfied) {
      failures.push(
        [
          `✖ ${current.id} (${changedSkill.directory})`,
          `  required bump : ${diff.requiredBump}`,
          `  actual bump   : ${actualBump}  (${oldSnapshot.version} → ${newSnapshot.version})`,
          `  changed files :`,
          ...fileLines,
          `  detected changes:`,
          ...changeLines,
          `  Fix: bump "version" in ${changedSkill.directory}/skill.yaml to at least ${suggestNextVersion(oldSnapshot.version, diff.requiredBump)}.`,
        ].join("\n"),
      );
    } else {
      summary.push(
        `· ${current.id} — ${oldSnapshot.version} → ${newSnapshot.version} (required ${diff.requiredBump}, got ${actualBump}). OK`,
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
  console.log(`[verify:skills] ${changedSkills.length} changed skill(s) passed version-bump policy.`);
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
