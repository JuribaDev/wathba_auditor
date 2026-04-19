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
};

export function toSnapshot(input: SkillSnapshotBuildInput): SkillSnapshotInput {
  const { canonical, body, references, scripts } = input;
  return {
    id: canonical.id,
    slug: canonical.slug,
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
    body,
    references: references.slice().sort((a, b) => a.path.localeCompare(b.path)),
    scripts: scripts.slice().sort((a, b) => a.path.localeCompare(b.path)),
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

  const references = loadDirAtRef(loader, path.posix.join(skillDir, "references"));
  const scripts = loadDirAtRef(loader, path.posix.join(skillDir, "scripts"));

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
  });
}

function loadDirAtRef(loader: GitSnapshotLoader, dirPath: string): SkillFile[] {
  const entries = listTreeAtRef(loader.cwd, loader.ref, `${dirPath}/`);
  const files: SkillFile[] = [];
  for (const entry of entries) {
    const relative = entry.startsWith(`${dirPath}/`) ? entry.slice(dirPath.length + 1) : entry;
    const content = readFileAtRef(loader.cwd, loader.ref, entry);
    if (content !== null) {
      files.push({ path: relative, content });
    }
  }
  return files;
}

export type WorkingTreeSkill = {
  directory: string;
  snapshot: SkillSnapshotInput;
};

export function loadSkillSnapshotFromLoadedSkill(loaded: {
  id: string;
  slug: string;
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
  directory: string;
}): SkillSnapshotInput {
  return {
    id: loaded.id,
    slug: loaded.slug,
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
    body: loaded.body,
    references: loaded.references
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path)),
    scripts: loaded.scripts.slice().sort((a, b) => a.path.localeCompare(b.path)),
  };
}
