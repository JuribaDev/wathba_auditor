// Drift check: fail if the generated plugin tree or marketplace manifest has
// diverged from what the canonical skills/ library would produce right now.
// The calling script (`pnpm verify:plugin-dist`) runs the generator first,
// then invokes this check so git diff reports real drift.

import { spawnSync } from "node:child_process";
import path from "node:path";

import { repoRootFromCwd } from "./lib/git-utils";

const REPO_ROOT = repoRootFromCwd(process.cwd());

const WATCHED_PATHS = [".claude-plugin/marketplace.json", "plugins/wathba-skills"];

function run(args: readonly string[]): {
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const result = spawnSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    status: result.status ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function main() {
  const diff = run([
    "--no-pager",
    "diff",
    "--exit-code",
    "--",
    ...WATCHED_PATHS,
  ]);
  if (diff.status === 0) {
    console.log(
      `[check:plugin-dist-drift] plugin dist matches canonical skills/ (watched: ${WATCHED_PATHS.join(", ")}).`,
    );
    return;
  }

  console.error(
    `[check:plugin-dist-drift] ${WATCHED_PATHS.join(", ")} is out of sync with skills/. Regenerate and stage.`,
  );
  if (diff.stdout.length > 0) {
    const excerpt = diff.stdout.split("\n").slice(0, 160).join("\n");
    console.error("\n----- DIFF (first 160 lines) -----");
    console.error(excerpt);
    console.error("----- END DIFF -----\n");
  }
  console.error(
    [
      "Fix locally:",
      "  1. pnpm generate:skills",
      "  2. pnpm generate:plugin-dist",
      `  3. git add ${WATCHED_PATHS.join(" ")}`,
      "  4. Re-run your commit.",
      "",
      "CI will fail until the regenerated dist is committed.",
      "",
      `(resolved repo root: ${path.relative(process.cwd(), REPO_ROOT) || "."})`,
    ].join("\n"),
  );
  process.exitCode = 1;
}

main();
