export const QUESTIONNAIRE_STEP_IDS = [
  "about",
  "tech",
  "review",
  "generate",
] as const;

export type QuestionnaireStepId = (typeof QUESTIONNAIRE_STEP_IDS)[number];

export const QUESTIONNAIRE_STEP_COUNT = QUESTIONNAIRE_STEP_IDS.length;

export function isQuestionnaireStepId(value: unknown): value is QuestionnaireStepId {
  return (
    typeof value === "string" &&
    (QUESTIONNAIRE_STEP_IDS as readonly string[]).includes(value)
  );
}

export function indexForStep(step: QuestionnaireStepId): number {
  return QUESTIONNAIRE_STEP_IDS.indexOf(step);
}

export function stepForIndex(index: number): QuestionnaireStepId {
  return QUESTIONNAIRE_STEP_IDS[clampIndex(index)];
}

export function clampIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  if (index < 0) return 0;
  if (index > QUESTIONNAIRE_STEP_COUNT - 1) return QUESTIONNAIRE_STEP_COUNT - 1;
  return Math.trunc(index);
}

export function nextStepIndex(index: number): number {
  return clampIndex(index + 1);
}

export function prevStepIndex(index: number): number {
  return clampIndex(index - 1);
}

export function isFinalStep(index: number): boolean {
  return clampIndex(index) === QUESTIONNAIRE_STEP_COUNT - 1;
}

export function isFirstStep(index: number): boolean {
  return clampIndex(index) === 0;
}
