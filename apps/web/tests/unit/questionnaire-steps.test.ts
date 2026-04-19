import { describe, expect, it } from "vitest";

import {
  QUESTIONNAIRE_STEP_COUNT,
  QUESTIONNAIRE_STEP_IDS,
  clampIndex,
  indexForStep,
  isFinalStep,
  isFirstStep,
  isQuestionnaireStepId,
  nextStepIndex,
  prevStepIndex,
  stepForIndex,
} from "@/lib/questionnaire/steps";

describe("questionnaire step ordering", () => {
  it("exposes the four prototype steps in order", () => {
    expect(QUESTIONNAIRE_STEP_IDS).toEqual([
      "about",
      "tech",
      "review",
      "generate",
    ]);
    expect(QUESTIONNAIRE_STEP_COUNT).toBe(4);
  });

  it("maps step id to index and back", () => {
    for (const id of QUESTIONNAIRE_STEP_IDS) {
      expect(stepForIndex(indexForStep(id))).toBe(id);
    }
  });
});

describe("clampIndex", () => {
  it("clamps negatives to 0", () => {
    expect(clampIndex(-5)).toBe(0);
  });

  it("clamps overshoot to the last step", () => {
    expect(clampIndex(42)).toBe(QUESTIONNAIRE_STEP_COUNT - 1);
  });

  it("returns 0 for NaN", () => {
    expect(clampIndex(Number.NaN)).toBe(0);
  });

  it("truncates floats", () => {
    expect(clampIndex(2.7)).toBe(2);
  });
});

describe("navigation helpers", () => {
  it("advances through each step until the final index", () => {
    expect(nextStepIndex(0)).toBe(1);
    expect(nextStepIndex(1)).toBe(2);
    expect(nextStepIndex(2)).toBe(3);
    expect(nextStepIndex(3)).toBe(3);
  });

  it("walks back to the first step", () => {
    expect(prevStepIndex(3)).toBe(2);
    expect(prevStepIndex(1)).toBe(0);
    expect(prevStepIndex(0)).toBe(0);
  });

  it("identifies boundary steps", () => {
    expect(isFirstStep(0)).toBe(true);
    expect(isFirstStep(1)).toBe(false);
    expect(isFinalStep(QUESTIONNAIRE_STEP_COUNT - 1)).toBe(true);
    expect(isFinalStep(0)).toBe(false);
  });
});

describe("isQuestionnaireStepId", () => {
  it("accepts valid ids", () => {
    expect(isQuestionnaireStepId("about")).toBe(true);
    expect(isQuestionnaireStepId("generate")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isQuestionnaireStepId("other")).toBe(false);
    expect(isQuestionnaireStepId(2)).toBe(false);
    expect(isQuestionnaireStepId(undefined)).toBe(false);
  });
});
