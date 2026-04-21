import { promises as fs } from "node:fs";
import path from "node:path";

import yaml from "js-yaml";

import {
  collectLifecycleCrossReferences,
  parseCanonicalSkill,
  SkillValidationError,
  type GeneratedSkill,
  type SkillFile,
  type SkillReference,
  type SkillScript,
} from "../../packages/skill-schema/src/index";

export class SkillLoaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillLoaderError";
  }
}

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Files reserved at the skill root — consumed directly, never treated as support files.
const RESERVED_ROOT_FILES = new Set(["skill.yaml", "SKILL.md"]);

// Junk that is NEVER a legitimate authored file — OS metadata and editor swap files.
// Filtered at any depth.
const UNIVERSAL_JUNK_FILES = new Set([
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
]);

// Filenames that are almost always accidental at the skill root but may be
// intentional support content deeper in the tree (e.g. a template bundle that
// ships its own `.gitignore` or `.gitkeep`). Only filtered at the root.
const ROOT_ONLY_JUNK_FILES = new Set([".gitkeep", ".gitignore"]);

// Directories we never descend into. Prevents dev artifacts from leaking into packages.
const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".cache",
  "__pycache__",
  ".pytest_cache",
]);

function isIgnoredName(name: string, atRoot: boolean): boolean {
  if (UNIVERSAL_JUNK_FILES.has(name)) return true;
  if (atRoot && ROOT_ONLY_JUNK_FILES.has(name)) return true;
  if (name.startsWith("._")) return true; // macOS AppleDouble resource forks
  if (name.endsWith("~") || name.endsWith(".bak") || name.endsWith(".tmp") || name.endsWith(".swp")) {
    return true;
  }
  return false;
}

function toPosix(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

async function assertSkillFolderStructure(options: {
  skillYamlPath: string;
  skillsRoot: string;
  sourceLabel: string;
  slug: string;
}): Promise<void> {
  const { skillYamlPath, skillsRoot, sourceLabel, slug } = options;
  const directory = path.dirname(skillYamlPath);
  const relativeDir = path.relative(skillsRoot, directory);
  const segments = relativeDir.split(path.sep).filter(Boolean);

  if (segments.length !== 2) {
    throw new SkillLoaderError(
      `Invalid skill folder depth at ${sourceLabel}. Skills must live at skills/<category-or-region>/<slug>/, but found "${relativeDir}".`,
    );
  }

  const [group, leaf] = segments;
  if (!KEBAB_CASE.test(group)) {
    throw new SkillLoaderError(
      `Invalid group folder "${group}" at ${sourceLabel}. The skills/<group>/ folder name must be kebab-case (lowercase letters and digits separated by single hyphens).`,
    );
  }

  if (leaf !== slug) {
    throw new SkillLoaderError(
      `Folder name "${leaf}" does not match skill slug "${slug}" at ${sourceLabel}. The leaf folder under skills/${group}/ must equal the skill's slug field.`,
    );
  }
}

async function walk(skillsRoot: string): Promise<string[]> {
  // Canonical skill roots live at exactly `skills/<group>/<slug>/skill.yaml`. A
  // *recursive* walk would also match `skill.yaml` files that authors legitimately
  // bundle as templates or example configs (e.g. `templates/skill.yaml`). Those
  // are support files, not additional skills — treating them as skills produces
  // bogus "invalid folder depth" or schema-validation errors during load.
  const matches: string[] = [];
  let groups: import("node:fs").Dirent[];
  try {
    groups = await fs.readdir(skillsRoot, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return matches;
    throw error;
  }

  for (const group of groups) {
    if (!group.isDirectory()) continue;
    if (IGNORED_DIRS.has(group.name)) continue;
    const groupDir = path.join(skillsRoot, group.name);
    let leaves: import("node:fs").Dirent[];
    try {
      leaves = await fs.readdir(groupDir, { withFileTypes: true });
    } catch {
      continue;
    }

    // A `skill.yaml` directly under `skills/<group>/` (no slug folder in
    // between) is a misplaced skill descriptor — not a support file. Surface
    // it as a loader error so the author notices during local development.
    for (const leaf of leaves) {
      if (leaf.isFile() && leaf.name === "skill.yaml") {
        const misplaced = path.join(groupDir, leaf.name);
        throw new SkillLoaderError(
          `Invalid skill folder depth at ${misplaced}. Skills must live at skills/<category-or-region>/<slug>/skill.yaml, but this descriptor is one level too shallow.`,
        );
      }
    }

    for (const leaf of leaves) {
      if (!leaf.isDirectory()) continue;
      if (IGNORED_DIRS.has(leaf.name)) continue;
      const skillDir = path.join(groupDir, leaf.name);
      const yamlPath = path.join(skillDir, "skill.yaml");
      let canonicalExists = false;
      try {
        const stat = await fs.stat(yamlPath);
        if (stat.isFile()) {
          matches.push(yamlPath);
          canonicalExists = true;
        }
      } catch {
        /* no canonical skill.yaml at the slug level */
      }

      if (canonicalExists) {
        // Inside a canonical skill folder, deeper `skill.yaml` files are
        // support files (template bundles, example configs) and must not
        // be checked again.
        continue;
      }

      // No canonical skill.yaml at depth 2 but this folder still holds one
      // somewhere deeper — that's an orphan descriptor the author probably
      // meant to place at depth 2. Surface it as a loader error instead of
      // silently dropping the skill.
      const stray = await findStraySkillYaml(skillDir);
      if (stray !== null) {
        throw new SkillLoaderError(
          `Invalid skill folder depth at ${stray}. Skills must live at skills/<category-or-region>/<slug>/skill.yaml. Move the descriptor up to the slug folder or place it inside a canonical skill package.`,
        );
      }
    }
  }

  return matches;
}

async function findStraySkillYaml(dir: string): Promise<string | null> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const entryPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === "skill.yaml") {
      return entryPath;
    }
    if (entry.isDirectory()) {
      const found = await findStraySkillYaml(entryPath);
      if (found) return found;
    }
  }
  return null;
}

// Sniff a byte chunk to decide whether the file can safely round-trip as utf-8 text.
// Treat any file with a NUL byte inside the sampled window as binary, and also fall
// back to binary if utf-8 validation fails.
function looksBinary(buffer: Buffer): boolean {
  const sampleEnd = Math.min(buffer.length, 8192);
  for (let i = 0; i < sampleEnd; i += 1) {
    if (buffer[i] === 0) return true;
  }
  try {
    // TextDecoder with fatal: true throws on invalid utf-8 sequences.
    new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, sampleEnd));
    return false;
  } catch {
    return true;
  }
}

async function collectSupportFiles(
  skillDir: string,
  sourceLabel: string,
): Promise<SkillFile[]> {
  const files: SkillFile[] = [];
  const seen = new Set<string>();

  async function visit(currentDir: string, relativeSegments: string[]): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    // Deterministic order (macOS/Linux/Windows safe).
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        throw new SkillLoaderError(
          `Symbolic link "${entry.name}" is not allowed in skill folder ${sourceLabel}. Replace it with the real file to keep packaging deterministic and prevent escaping the skill directory.`,
        );
      }

      const atRoot = relativeSegments.length === 0;
      if (isIgnoredName(entry.name, atRoot)) continue;

      // Reserved root entries are consumed elsewhere.
      if (atRoot && RESERVED_ROOT_FILES.has(entry.name)) {
        continue;
      }

      const entryPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        await visit(entryPath, [...relativeSegments, entry.name]);
        continue;
      }

      if (!entry.isFile()) continue;

      const relativePathSegments = [...relativeSegments, entry.name];
      const normalizedPath = toPosix(relativePathSegments.join(path.sep));

      if (normalizedPath.includes("..") || normalizedPath.startsWith("/")) {
        throw new SkillLoaderError(
          `Unsafe support-file path "${normalizedPath}" inside skill folder ${sourceLabel}.`,
        );
      }

      if (seen.has(normalizedPath)) {
        throw new SkillLoaderError(
          `Duplicate support-file path "${normalizedPath}" inside skill folder ${sourceLabel}.`,
        );
      }

      const buffer = await fs.readFile(entryPath);
      const binary = looksBinary(buffer);

      if (binary) {
        files.push({
          path: normalizedPath,
          encoding: "base64",
          content: buffer.toString("base64"),
        });
      } else {
        files.push({
          path: normalizedPath,
          encoding: "utf-8",
          content: buffer.toString("utf-8"),
        });
      }
      seen.add(normalizedPath);
    }
  }

  await visit(skillDir, []);

  files.sort((left, right) => left.path.localeCompare(right.path, "en"));
  return files;
}

function deriveLegacyConvenienceLists(files: readonly SkillFile[]): {
  references: SkillReference[];
  scripts: SkillScript[];
} {
  const references: SkillReference[] = [];
  const scripts: SkillScript[] = [];
  for (const file of files) {
    // Legacy lists are filenames-under-the-prefix, text-only. Binary assets are omitted
    // here by design — callers that need full fidelity must read `files` instead.
    if (file.encoding !== "utf-8") continue;
    if (file.path.startsWith("references/")) {
      const rest = file.path.slice("references/".length);
      if (rest.length > 0 && !rest.includes("/")) {
        references.push({ path: rest, content: file.content });
      }
    } else if (file.path.startsWith("scripts/")) {
      const rest = file.path.slice("scripts/".length);
      if (rest.length > 0 && !rest.includes("/")) {
        scripts.push({ path: rest, content: file.content });
      }
    }
  }
  references.sort((left, right) => left.path.localeCompare(right.path, "en"));
  scripts.sort((left, right) => left.path.localeCompare(right.path, "en"));
  return { references, scripts };
}

async function readSkillBody(directory: string, sourceLabel: string): Promise<string> {
  const markdownPath = path.join(directory, "SKILL.md");
  try {
    return await fs.readFile(markdownPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new SkillLoaderError(
        `Missing SKILL.md for skill at ${sourceLabel}. Every skill folder must include a SKILL.md body next to its skill.yaml.`,
      );
    }
    throw error;
  }
}

export async function loadSkill(
  skillYamlPath: string,
  options: { skillsRoot: string; repoRoot: string },
): Promise<GeneratedSkill> {
  const { skillsRoot, repoRoot } = options;
  const directory = path.dirname(skillYamlPath);
  const sourceLabel = path.relative(repoRoot, skillYamlPath);

  const rawYaml = await fs.readFile(skillYamlPath, "utf8");
  const parsed = parseCanonicalSkill(yaml.load(rawYaml), { source: sourceLabel });
  await assertSkillFolderStructure({
    skillYamlPath,
    skillsRoot,
    sourceLabel,
    slug: parsed.slug,
  });
  const body = await readSkillBody(directory, sourceLabel);
  const files = await collectSupportFiles(directory, sourceLabel);
  const { references, scripts } = deriveLegacyConvenienceLists(files);

  return {
    id: parsed.id,
    name: parsed.name,
    summary: parsed.summary,
    slug: parsed.slug,
    previousIds: parsed.previous_id ?? [],
    version: parsed.version,
    category: parsed.category,
    region: parsed.region,
    targets: parsed.targets,
    status: parsed.status,
    lastVerified: parsed.last_verified,
    maintainers: parsed.maintainers,
    sources: parsed.sources,
    disclaimer: parsed.disclaimer,
    variables: parsed.variables,
    triggers: parsed.triggers,
    lifecycle: parsed.lifecycle,
    replacementId: parsed.replacement_id ?? null,
    sunsetDate: parsed.sunset_date ?? null,
    lifecycleNote: parsed.lifecycle_note ?? null,
    body,
    directory: toPosix(path.relative(skillsRoot, directory)),
    files,
    references,
    scripts,
  };
}

export async function loadSkillsFromDirectory(options: {
  skillsRoot: string;
  repoRoot: string;
}): Promise<GeneratedSkill[]> {
  const { skillsRoot, repoRoot } = options;
  const skillYamlFiles = await walk(skillsRoot);
  const skills = await Promise.all(
    skillYamlFiles.map((yamlPath) => loadSkill(yamlPath, { skillsRoot, repoRoot })),
  );

  const seen = new Map<string, string>();
  for (let index = 0; index < skills.length; index += 1) {
    const skill = skills[index];
    const sourceLabel = path.relative(repoRoot, skillYamlFiles[index]);
    const previous = seen.get(skill.id);
    if (previous) {
      throw new SkillLoaderError(
        `Duplicate skill id "${skill.id}" at ${sourceLabel}. Already declared at ${previous}.`,
      );
    }
    seen.set(skill.id, sourceLabel);
  }

  // Cross-skill lifecycle validation: replacement_id must resolve to an
  // existing skill, and a skill cannot declare itself as its own
  // replacement. Self-reference is also caught per-skill in the zod schema
  // but we repeat the check here so the error message names the catalog.
  const crossRefInput = skills.map((skill, index) => ({
    id: skill.id,
    replacement_id: skill.replacementId ?? undefined,
    sourceLabel: path.relative(repoRoot, skillYamlFiles[index]),
  }));
  const crossRefIssues = collectLifecycleCrossReferences(crossRefInput);
  if (crossRefIssues.length > 0) {
    const lines = crossRefIssues.map(
      (issue) =>
        `  - ${issue.sourceLabel ?? issue.skillId}: ${issue.message}`,
    );
    throw new SkillLoaderError(
      ["Invalid skill lifecycle references:", ...lines].join("\n"),
    );
  }

  skills.sort((left, right) => left.id.localeCompare(right.id));
  return skills;
}

export { SkillValidationError };
export type { GeneratedSkill };
