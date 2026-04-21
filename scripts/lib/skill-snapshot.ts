import path from "node:path";

import yaml from "js-yaml";

import {
  parseCanonicalSkill,
  type CanonicalSkill,
} from "../../packages/skill-schema/src/index";
import { listTreeAtRef, readFileAtRef } from "./git-utils";
import type { SkillFile, SkillSnapshotInput } from "./skill-diff";

export type SkillSnapshotBuildInput = {
  id: string;
  slug: string;
  group: string;
  directory: string;
  canonical: CanonicalSkill;
  body: string;
  references: SkillFile[];
  scripts: SkillFile[];
  files?: SkillFile[];
};

function sortByPath(files: readonly SkillFile[]): SkillFile[] {
  return files.slice().sort((a, b) => a.path.localeCompare(b.path));
}

export function toSnapshot(input: SkillSnapshotBuildInput): SkillSnapshotInput {
  const { canonical, body, references, scripts, files } = input;
  return {
    id: canonical.id,
    slug: canonical.slug,
    previousIds: canonical.previous_id ?? [],
    version: canonical.version,
    category: canonical.category,
    region: canonical.region,
    status: canonical.status,
    disclaimer: canonical.disclaimer,
    lastVerified: canonical.last_verified,
    name: canonical.name,
    summary: canonical.summary,
    maintainers: canonical.maintainers,
    sources: canonical.sources,
    targets: canonical.targets,
    variables: canonical.variables.map((variable) => ({
      name: variable.name,
      label: variable.label,
      type: variable.type,
      options: variable.options,
    })),
    triggers: canonical.triggers,
    lifecycle: canonical.lifecycle,
    replacementId: canonical.replacement_id ?? null,
    sunsetDate: canonical.sunset_date ?? null,
    lifecycleNote: canonical.lifecycle_note ?? null,
    body,
    references: sortByPath(references),
    scripts: sortByPath(scripts),
    files: files ? sortByPath(files) : [],
  };
}

export function parseYamlToCanonical(
  rawYaml: string,
  sourceLabel: string,
): CanonicalSkill {
  return parseCanonicalSkill(yaml.load(rawYaml), { source: sourceLabel });
}

export type GitSnapshotLoader = {
  cwd: string;
  ref: string;
};

export function loadSkillSnapshotAtRef(
  loader: GitSnapshotLoader,
  skillDir: string,
): SkillSnapshotInput | null {
  const yamlPath = path.posix.join(skillDir, "skill.yaml");
  const rawYaml = readFileAtRef(loader.cwd, loader.ref, yamlPath);
  if (rawYaml === null) return null;

  let canonical: CanonicalSkill;
  try {
    canonical = parseYamlToCanonical(rawYaml, `${loader.ref}:${yamlPath}`);
  } catch {
    return null;
  }

  const bodyPath = path.posix.join(skillDir, "SKILL.md");
  const body = readFileAtRef(loader.cwd, loader.ref, bodyPath) ?? "";

  // Walk every file under the skill root at this ref (except the reserved
  // `skill.yaml` + `SKILL.md`). This covers `references/`, `scripts/`,
  // `assets/`, `templates/`, `agents/openai.yaml`, and any other author-
  // bundled support file — so governance can detect changes to all of them.
  const allFiles = loadTreeAtRef(loader, skillDir);
  const references = allFiles
    .filter((file) => file.path.startsWith("references/") && !file.path.slice("references/".length).includes("/"))
    .map((file) => ({ path: file.path.slice("references/".length), content: file.content }));
  const scripts = allFiles
    .filter((file) => file.path.startsWith("scripts/") && !file.path.slice("scripts/".length).includes("/"))
    .map((file) => ({ path: file.path.slice("scripts/".length), content: file.content }));

  const parts = skillDir.split("/").filter(Boolean);
  const group = parts[1] ?? "";

  return toSnapshot({
    id: canonical.id,
    slug: canonical.slug,
    group,
    directory: skillDir,
    canonical,
    body,
    references,
    scripts,
    files: allFiles,
  });
}

// Read every text-looking file under the skill directory at the given git ref.
// Binary blobs (detected by a NUL byte in the git-show output) are skipped —
// they would always compare "changed" against base64-encoded working-tree
// entries and produce false-positive governance failures.
function loadTreeAtRef(
  loader: GitSnapshotLoader,
  skillDir: string,
): SkillFile[] {
  const prefix = `${skillDir}/`;
  const entries = listTreeAtRef(loader.cwd, loader.ref, prefix);
  const files: SkillFile[] = [];
  for (const entry of entries) {
    const relative = entry.startsWith(prefix) ? entry.slice(prefix.length) : entry;
    if (relative === "skill.yaml" || relative === "SKILL.md") continue;
    if (relative === "" || relative.includes("..")) continue;
    const content = readFileAtRef(loader.cwd, loader.ref, entry);
    if (content === null) continue;
    if (content.includes("\0")) continue; // skip non-text blobs (see comment above)
    files.push({ path: relative, content });
  }
  return files;
}

export type WorkingTreeSkill = {
  directory: string;
  snapshot: SkillSnapshotInput;
};

export type SkillIndexEntry = {
  directory: string;
  snapshot: SkillSnapshotInput;
};

export function listSkillYamlPathsAtRef(loader: GitSnapshotLoader): string[] {
  const entries = listTreeAtRef(loader.cwd, loader.ref, "skills/");
  return entries.filter((entry) => entry.endsWith("/skill.yaml"));
}

export function indexSkillsAtRef(
  loader: GitSnapshotLoader,
): Map<string, SkillIndexEntry> {
  const index = new Map<string, SkillIndexEntry>();
  const paths = listSkillYamlPathsAtRef(loader);
  for (const yamlPath of paths) {
    const directory = yamlPath.slice(0, yamlPath.lastIndexOf("/"));
    const snapshot = loadSkillSnapshotAtRef(loader, directory);
    if (!snapshot) continue;
    index.set(snapshot.id, { directory, snapshot });
  }
  return index;
}

export type LoadedSkillLike = {
  id: string;
  slug: string;
  previousIds?: readonly string[];
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
  // Generic support-file list from the GeneratedSkill shape. Entries carry
  // encoding info so we can exclude binary blobs from the governance diff
  // (they don't round-trip through `git show` as utf-8, so diffing them
  // would produce false positives).
  files?: ReadonlyArray<{ path: string; encoding: "utf-8" | "base64"; content: string }>;
  directory: string;
  lifecycle?: string;
  replacementId?: string | null;
  sunsetDate?: string | null;
  lifecycleNote?: { en: string; ar: string } | null;
};

export function loadSkillSnapshotFromLoadedSkill(
  loaded: LoadedSkillLike,
): SkillSnapshotInput {
  const textFiles: SkillFile[] = (loaded.files ?? [])
    .filter((file) => file.encoding === "utf-8")
    .map((file) => ({ path: file.path, content: file.content }));
  return {
    id: loaded.id,
    slug: loaded.slug,
    previousIds: loaded.previousIds ?? [],
    version: loaded.version,
    category: loaded.category,
    region: loaded.region,
    status: loaded.status,
    disclaimer: loaded.disclaimer,
    lastVerified: loaded.lastVerified,
    name: loaded.name,
    summary: loaded.summary,
    maintainers: loaded.maintainers,
    sources: loaded.sources,
    targets: loaded.targets,
    variables: loaded.variables,
    triggers: loaded.triggers,
    lifecycle: loaded.lifecycle ?? "active",
    replacementId: loaded.replacementId ?? null,
    sunsetDate: loaded.sunsetDate ?? null,
    lifecycleNote: loaded.lifecycleNote ?? null,
    body: loaded.body,
    references: sortByPath(loaded.references),
    scripts: sortByPath(loaded.scripts),
    files: sortByPath(textFiles),
  };
}
