import { promises as fs } from "node:fs";
import path from "node:path";

import yaml from "js-yaml";

import {
  parseCanonicalSkill,
  SkillValidationError,
  type GeneratedSkill,
} from "../../packages/skill-schema/src/index";

export class SkillLoaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillLoaderError";
  }
}

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ALLOWED_SKILL_FILES = new Set(["skill.yaml", "SKILL.md"]);
const ALLOWED_SKILL_DIRS = new Set(["references", "scripts"]);

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

  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ALLOWED_SKILL_DIRS.has(entry.name)) {
        throw new SkillLoaderError(
          `Unexpected directory "${entry.name}/" inside skill folder ${sourceLabel}. Only references/ and scripts/ subfolders are allowed.`,
        );
      }
      continue;
    }
    if (entry.isFile()) {
      if (!ALLOWED_SKILL_FILES.has(entry.name)) {
        throw new SkillLoaderError(
          `Unexpected file "${entry.name}" inside skill folder ${sourceLabel}. Only skill.yaml and SKILL.md are allowed at the root of a skill folder.`,
        );
      }
    }
  }
}

async function walk(currentDir: string, matches: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      await walk(entryPath, matches);
      continue;
    }

    if (entry.name === "skill.yaml") {
      matches.push(entryPath);
    }
  }

  return matches;
}

async function listRelativeFiles(
  directory: string,
): Promise<Array<{ path: string; content: string }>> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile());
    const loaded = await Promise.all(
      files.map(async (entry) => ({
        path: entry.name,
        content: await fs.readFile(path.join(directory, entry.name), "utf8"),
      })),
    );
    return loaded.sort((left, right) => left.path.localeCompare(right.path));
  } catch {
    return [];
  }
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
  const references = await listRelativeFiles(path.join(directory, "references"));
  const scripts = await listRelativeFiles(path.join(directory, "scripts"));

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
    body,
    directory: path.relative(skillsRoot, directory),
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

  skills.sort((left, right) => left.id.localeCompare(right.id));
  return skills;
}

export { SkillValidationError };
export type { GeneratedSkill };
