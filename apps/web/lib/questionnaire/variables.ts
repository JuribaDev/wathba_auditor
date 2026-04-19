import type { ReviewSelections } from "@/components/questionnaire/step-review";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { QuestionnaireAnswers } from "@/lib/skills/recommendations";

export type VariableValue = string | boolean;

export type VariableValues = Record<string, VariableValue>;

export function makeVariableKey(skillId: string, variableName: string): string {
  return `${skillId}.${variableName}`;
}

export function getActiveVariableSkills(
  catalog: readonly GeneratedSkill[],
  selections: ReviewSelections,
): GeneratedSkill[] {
  return catalog.filter((skill) => {
    const selection = selections[skill.id];
    if (!selection?.on) return false;
    return skill.variables.length > 0;
  });
}

export function resolveVariableDefault(
  variable: GeneratedSkill["variables"][number],
  answers: QuestionnaireAnswers,
): VariableValue | undefined {
  if (variable.name === "stack" && typeof answers.stack === "string") {
    if (variable.type === "select") {
      const options = variable.options ?? [];
      if (options.includes(answers.stack)) {
        return answers.stack;
      }
    }
  }
  return undefined;
}

export function getVariableValue(
  values: VariableValues,
  skillId: string,
  variable: GeneratedSkill["variables"][number],
  answers: QuestionnaireAnswers,
): VariableValue | undefined {
  const key = makeVariableKey(skillId, variable.name);
  if (key in values) {
    return values[key];
  }
  return resolveVariableDefault(variable, answers);
}
