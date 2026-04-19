import path from "node:path";

import {
  evaluateComplianceFreshness,
  readConfigFromEnv,
} from "./lib/compliance-freshness";
import {
  GitError,
  listChangedFiles,
  repoRootFromCwd,
  resolveBaseRef,
} from "./lib/git-utils";
import { loadSkillsFromDirectory } from "./lib/skill-loader";

const REPO_ROOT = repoRootFromCwd(process.cwd());
const SKILLS_ROOT = path.join(REPO_ROOT, "skills");

function changedSkillDirectories(changedFiles: readonly string[]): Set<string> {
  const dirs = new Set<string>();
  for (const file of changedFiles) {
    const normalized = file.replaceAll("\\", "/");
    if (!normalized.startsWith("skills/")) continue;
    const segments = normalized.split("/");
    if (segments.length < 4) continue;
    dirs.add(segments.slice(0, 3).join("/"));
  }
  return dirs;
}

async function main() {
  const override = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  const allFlag = process.argv.includes("--all");

  const baseRef = allFlag ? null : resolveBaseRef(REPO_ROOT, override);
  let focusDirs: Set<string> | null = null;

  if (!allFlag) {
    if (!baseRef) {
      console.warn(
        "[check:compliance-freshness] No git base ref resolved. Skipping (pass --all to force a full scan).",
      );
      return;
    }
    try {
      const changed = listChangedFiles(REPO_ROOT, baseRef.ref);
      focusDirs = changedSkillDirectories(changed);
    } catch (error) {
      if (error instanceof GitError) {
        console.error(
          `[check:compliance-freshness] git diff failed against ${baseRef.ref}:\n${error.stderr}`,
        );
        process.exitCode = 1;
        return;
      }
      throw error;
    }
    if (focusDirs.size === 0) {
      console.log(
        "[check:compliance-freshness] No changed skills since base; skipping freshness check.",
      );
      return;
    }
  }

  const skills = await loadSkillsFromDirectory({
    skillsRoot: SKILLS_ROOT,
    repoRoot: REPO_ROOT,
  });

  const config = readConfigFromEnv();
  let failures = 0;
  let checked = 0;

  for (const skill of skills) {
    const dir = `skills/${skill.directory}`.replaceAll("\\", "/");
    if (!allFlag && focusDirs && !focusDirs.has(dir)) continue;
    if (skill.category !== "compliance") continue;

    checked += 1;
    const result = evaluateComplianceFreshness(
      {
        id: skill.id,
        slug: skill.slug,
        category: skill.category,
        disclaimer: skill.disclaimer,
        lastVerified: skill.lastVerified,
        sources: skill.sources,
      },
      config,
    );

    if (result.issues.length === 0) continue;

    failures += 1;
    console.error(
      `\n✖ ${skill.id} (${dir}) — compliance freshness issues:`,
    );
    for (const issue of result.issues) {
      console.error(`  · [${issue.code}] ${issue.field}: ${issue.message}`);
    }
  }

  if (failures > 0) {
    console.error(
      `\n[check:compliance-freshness] ${failures} compliance skill(s) failed. ` +
        `Thresholds: last_verified ≤ ${config.lastVerifiedMaxDays} days, ` +
        `source accessed ≤ ${config.sourceAccessedMaxDays} days. ` +
        "Override via WATHBA_LAST_VERIFIED_MAX_DAYS and WATHBA_SOURCE_ACCESSED_MAX_DAYS.",
    );
    process.exitCode = 1;
    return;
  }
  const scope = allFlag ? "all compliance skills" : "changed compliance skills";
  console.log(
    `[check:compliance-freshness] ${checked} ${scope} passed (as of ${config.now.toISOString().slice(0, 10)}).`,
  );
}

main().catch((error) => {
  console.error("[check:compliance-freshness] Unexpected failure:", error);
  process.exitCode = 1;
});
