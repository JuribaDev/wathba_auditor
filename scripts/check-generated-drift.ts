import { spawnSync } from "node:child_process";

import { repoRootFromCwd } from "./lib/git-utils";

const REPO_ROOT = repoRootFromCwd(process.cwd());
const GENERATED_PATH = "apps/web/lib/skills/generated.ts";

function run(args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    status: result.status ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function main() {
  // Drift detection strategy:
  //   After `pnpm generate:skills` runs, the working tree holds the freshly
  //   regenerated file. If the contributor already staged a matching copy,
  //   worktree == index and `git diff` (worktree-vs-index) is empty.
  //   If they forgot to stage OR regenerate OR staged a stale version,
  //   worktree != index and the diff is non-empty.
  //
  //   This is intentionally stricter than `git status --porcelain`, which
  //   flags *any* deviation from HEAD (including correctly-staged changes)
  //   and would reject legitimate skill commits during pre-commit.
  const diff = run(["--no-pager", "diff", "--exit-code", "--", GENERATED_PATH]);
  if (diff.status === 0) {
    console.log(
      `[check:drift] ${GENERATED_PATH} matches the current skills/ tree (staged or committed).`,
    );
    return;
  }

  const header = `[check:drift] ${GENERATED_PATH} is out of sync with skills/. Regenerate and stage it.`;
  console.error(header);
  if (diff.stdout.length > 0) {
    const excerpt = diff.stdout.split("\n").slice(0, 120).join("\n");
    console.error("\n----- DIFF (first 120 lines) -----");
    console.error(excerpt);
    console.error("----- END DIFF -----\n");
  }
  console.error(
    [
      "Fix locally:",
      "  1. pnpm generate:skills",
      `  2. git add ${GENERATED_PATH}`,
      "  3. Re-run your commit.",
      "",
      "CI will fail until the regenerated file is committed.",
    ].join("\n"),
  );
  process.exitCode = 1;
}

main();
