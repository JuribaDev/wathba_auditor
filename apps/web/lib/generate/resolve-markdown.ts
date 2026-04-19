import {
  getVariableValue,
  type VariableValue,
  type VariableValues,
} from "@/lib/questionnaire/variables";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { QuestionnaireAnswers } from "@/lib/skills/recommendations";

export const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

export type SkillResolution = {
  skillId: string;
  slug: string;
  body: string;
  missing: readonly string[];
};

export type MissingVariables = {
  skillId: string;
  slug: string;
  name: { en: string; ar: string };
  variables: readonly string[];
};

export type ResolvedCatalog = {
  resolutions: readonly SkillResolution[];
  skillsWithMissing: readonly MissingVariables[];
  hasMissing: boolean;
};

function formatValue(value: VariableValue): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  return value;
}

function isMissing(value: VariableValue | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === "string" && value === "") return true;
  return false;
}

export function resolveSkillMarkdown(
  skill: GeneratedSkill,
  values: VariableValues,
  answers: QuestionnaireAnswers,
): SkillResolution {
  const resolved = new Map<string, string>();
  const missing: string[] = [];
  const seenMissing = new Set<string>();

  const recordMissing = (name: string) => {
    if (seenMissing.has(name)) return;
    seenMissing.add(name);
    missing.push(name);
  };

  for (const variable of skill.variables) {
    const value = getVariableValue(values, skill.id, variable, answers);
    if (isMissing(value)) {
      recordMissing(variable.name);
      continue;
    }
    resolved.set(variable.name, formatValue(value as VariableValue));
  }

  const body = skill.body.replace(
    PLACEHOLDER_PATTERN,
    (match, name: string) => {
      const value = resolved.get(name);
      if (value === undefined) {
        recordMissing(name);
        return match;
      }
      return value;
    },
  );

  return {
    skillId: skill.id,
    slug: skill.slug,
    body,
    missing,
  };
}

export function resolveSelectedSkills(
  skills: readonly GeneratedSkill[],
  values: VariableValues,
  answers: QuestionnaireAnswers,
): ResolvedCatalog {
  const resolutions = skills.map((skill) =>
    resolveSkillMarkdown(skill, values, answers),
  );
  const skillIndex = new Map(skills.map((skill) => [skill.id, skill]));
  const skillsWithMissing: MissingVariables[] = [];
  for (const resolution of resolutions) {
    if (resolution.missing.length === 0) continue;
    const skill = skillIndex.get(resolution.skillId);
    if (!skill) continue;
    skillsWithMissing.push({
      skillId: resolution.skillId,
      slug: resolution.slug,
      name: skill.name,
      variables: resolution.missing,
    });
  }
  return {
    resolutions,
    skillsWithMissing,
    hasMissing: skillsWithMissing.length > 0,
  };
}
