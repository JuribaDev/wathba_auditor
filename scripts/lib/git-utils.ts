import { execFileSync, spawnSync } from "node:child_process";

type SpawnResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

function runGit(args: readonly string[], cwd: string): SpawnResult {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    status: result.status ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export class GitError extends Error {
  readonly stderr: string;
  constructor(message: string, stderr: string) {
    super(message);
    this.name = "GitError";
    this.stderr = stderr;
  }
}

export function resolveBaseRef(
  cwd: string,
  override?: string,
): { ref: string; source: string } | null {
  if (override && override.length > 0) {
    return { ref: override, source: "override" };
  }
  const fromEnv = process.env.WATHBA_BASE_REF;
  if (fromEnv) return { ref: fromEnv, source: "WATHBA_BASE_REF" };
  const ghBase = process.env.GITHUB_BASE_REF;
  if (ghBase) {
    const remote = process.env.WATHBA_BASE_REMOTE ?? "origin";
    return { ref: `${remote}/${ghBase}`, source: "GITHUB_BASE_REF" };
  }
  const candidates = ["origin/main", "main"];
  for (const candidate of candidates) {
    const mergeBase = runGit(["merge-base", "HEAD", candidate], cwd);
    if (mergeBase.status === 0) {
      return { ref: mergeBase.stdout.trim(), source: `merge-base HEAD ${candidate}` };
    }
  }
  return null;
}

export function listChangedFiles(
  cwd: string,
  baseRef: string,
): string[] {
  // `git diff <baseRef>` compares <baseRef> against the working tree, so it
  // picks up every state on this branch (committed + staged + unstaged). This
  // matters for pre-commit where staged changes are not yet part of HEAD.
  //
  // `--diff-filter=ACMRTD` includes Adds, Modifies, Copies, Renames, Type
  // changes, and Deletes so a PR that only deletes a skill asset is still
  // surfaced to the governance checks.
  const diff = runGit(
    ["diff", "--name-only", "--diff-filter=ACMRTD", baseRef],
    cwd,
  );
  if (diff.status !== 0) {
    throw new GitError(
      `git diff failed against base ref "${baseRef}".`,
      diff.stderr,
    );
  }
  const tracked = diff.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const untracked = runGit(
    ["ls-files", "--others", "--exclude-standard"],
    cwd,
  );
  if (untracked.status === 0) {
    for (const line of untracked.stdout.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !tracked.includes(trimmed)) tracked.push(trimmed);
    }
  }
  return tracked;
}

export function readFileAtRef(
  cwd: string,
  ref: string,
  filePath: string,
): string | null {
  const result = runGit(["show", `${ref}:${filePath}`], cwd);
  if (result.status !== 0) return null;
  return result.stdout;
}

export function listTreeAtRef(
  cwd: string,
  ref: string,
  prefix: string,
): string[] {
  const result = runGit(["ls-tree", "-r", "--name-only", ref, "--", prefix], cwd);
  if (result.status !== 0) return [];
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function repoRootFromCwd(cwd: string): string {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
    }).trim();
  } catch {
    return cwd;
  }
}
