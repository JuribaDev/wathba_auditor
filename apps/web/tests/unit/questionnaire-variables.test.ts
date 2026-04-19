import { describe, expect, it } from "vitest";

import type { ReviewSelections } from "@/components/questionnaire/step-review";
import {
  getActiveVariableSkills,
  getVariableValue,
  makeVariableKey,
  resolveVariableDefault,
  type VariableValues,
} from "@/lib/questionnaire/variables";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { QuestionnaireAnswers } from "@/lib/skills/recommendations";

const catalog: GeneratedSkill[] = [
  {
    id: "skill-with-vars",
    name: { en: "A", ar: "A" },
    slug: "a",
    version: "0.1.0",
    category: "compliance",
    region: null,
    targets: ["claude-code"],
    status: "draft",
    lastVerified: "2026-01-01",
    maintainers: [],
    sources: [],
    disclaimer: false,
    variables: [
      {
        name: "stack",
        label: { en: "Stack", ar: "المنصة" },
        type: "select",
        options: ["nodejs", "python"],
      },
      {
        name: "has_pos",
        label: { en: "Has POS", ar: "نقطة بيع" },
        type: "boolean",
      },
    ],
    triggers: [],
    body: "",
    directory: "a",
    references: [],
    scripts: [],
  },
  {
    id: "skill-no-vars",
    name: { en: "B", ar: "B" },
    slug: "b",
    version: "0.1.0",
    category: "security",
    region: null,
    targets: ["claude-code"],
    status: "draft",
    lastVerified: "2026-01-01",
    maintainers: [],
    sources: [],
    disclaimer: false,
    variables: [],
    triggers: [],
    body: "",
    directory: "b",
    references: [],
    scripts: [],
  },
  {
    id: "skill-unused",
    name: { en: "C", ar: "C" },
    slug: "c",
    version: "0.1.0",
    category: "architecture",
    region: null,
    targets: ["claude-code"],
    status: "draft",
    lastVerified: "2026-01-01",
    maintainers: [],
    sources: [],
    disclaimer: false,
    variables: [
      {
        name: "stack",
        label: { en: "Stack", ar: "المنصة" },
        type: "select",
        options: ["nodejs"],
      },
    ],
    triggers: [],
    body: "",
    directory: "c",
    references: [],
    scripts: [],
  },
];

const stackVariable = catalog[0].variables[0];
const booleanVariable = catalog[0].variables[1];

describe("makeVariableKey", () => {
  it("joins skill id and variable name with a dot", () => {
    expect(makeVariableKey("skill-with-vars", "stack")).toBe(
      "skill-with-vars.stack",
    );
  });
});

describe("getActiveVariableSkills", () => {
  it("includes only selections that are on and have variables", () => {
    const selections: ReviewSelections = {
      "skill-with-vars": { on: true, source: "auto" },
      "skill-no-vars": { on: true, source: "auto" },
      "skill-unused": { on: false, source: "auto" },
    };
    const result = getActiveVariableSkills(catalog, selections);
    expect(result.map((s) => s.id)).toEqual(["skill-with-vars"]);
  });

  it("returns an empty array when no selections are on", () => {
    expect(getActiveVariableSkills(catalog, {})).toEqual([]);
  });

  it("treats off selections as excluded even when variables exist", () => {
    const selections: ReviewSelections = {
      "skill-with-vars": { on: false, source: "auto" },
    };
    expect(getActiveVariableSkills(catalog, selections)).toEqual([]);
  });
});

describe("resolveVariableDefault", () => {
  it("inherits stack from questionnaire answers when the option matches", () => {
    const answers: QuestionnaireAnswers = { stack: "nodejs" };
    expect(resolveVariableDefault(stackVariable, answers)).toBe("nodejs");
  });

  it("returns undefined when the answer stack is not in the variable options", () => {
    const answers: QuestionnaireAnswers = { stack: "dotnet" };
    expect(resolveVariableDefault(stackVariable, answers)).toBeUndefined();
  });

  it("returns undefined for non-stack variables", () => {
    expect(resolveVariableDefault(booleanVariable, {})).toBeUndefined();
  });

  it("returns undefined when the answer has no stack", () => {
    expect(resolveVariableDefault(stackVariable, {})).toBeUndefined();
  });
});

describe("getVariableValue", () => {
  it("prefers an explicit stored value over the inherited default", () => {
    const values: VariableValues = { "skill-with-vars.stack": "python" };
    const answers: QuestionnaireAnswers = { stack: "nodejs" };
    expect(
      getVariableValue(values, "skill-with-vars", stackVariable, answers),
    ).toBe("python");
  });

  it("falls back to the inherited default when the key is absent", () => {
    const answers: QuestionnaireAnswers = { stack: "python" };
    expect(getVariableValue({}, "skill-with-vars", stackVariable, answers)).toBe(
      "python",
    );
  });

  it("returns the stored value even when it is an empty string", () => {
    const values: VariableValues = { "skill-with-vars.stack": "" };
    const answers: QuestionnaireAnswers = { stack: "python" };
    expect(
      getVariableValue(values, "skill-with-vars", stackVariable, answers),
    ).toBe("");
  });

  it("returns stored boolean values without falling back", () => {
    const values: VariableValues = { "skill-with-vars.has_pos": true };
    expect(
      getVariableValue(values, "skill-with-vars", booleanVariable, {}),
    ).toBe(true);
  });

  it("returns undefined when no stored value and no applicable default", () => {
    expect(getVariableValue({}, "skill-with-vars", booleanVariable, {})).toBeUndefined();
  });
});
