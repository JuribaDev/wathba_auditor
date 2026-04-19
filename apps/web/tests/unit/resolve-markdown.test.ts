import { describe, expect, it } from "vitest";

import {
  PLACEHOLDER_PATTERN,
  resolveSelectedSkills,
  resolveSkillMarkdown,
} from "@/lib/generate/resolve-markdown";
import type { VariableValues } from "@/lib/questionnaire/variables";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { QuestionnaireAnswers } from "@/lib/skills/recommendations";

const makeSkill = (patch: Partial<GeneratedSkill> = {}): GeneratedSkill => ({
  id: "s1",
  name: { en: "Skill One", ar: "مهارة واحد" },
  slug: "s1",
  version: "0.1.0",
  category: "compliance",
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
  directory: "s1",
  references: [],
  scripts: [],
  ...patch,
});

const stackSelectVar = {
  name: "stack",
  label: { en: "Stack", ar: "المنصة" },
  type: "select" as const,
  options: ["nodejs", "python"],
};

const hasPosBoolVar = {
  name: "has_pos",
  label: { en: "Has POS", ar: "نقطة بيع" },
  type: "boolean" as const,
};

describe("PLACEHOLDER_PATTERN", () => {
  it("matches placeholders with and without internal whitespace", () => {
    const input = "a {{stack}} b {{ stack }} c {{\tstack }}";
    const hits = Array.from(input.matchAll(PLACEHOLDER_PATTERN)).map(
      (m) => m[1],
    );
    expect(hits).toEqual(["stack", "stack", "stack"]);
  });

  it("does not match braces without an identifier", () => {
    const input = "{{}} {{ }} {{ 1bad }}";
    const hits = Array.from(input.matchAll(PLACEHOLDER_PATTERN));
    expect(hits).toHaveLength(0);
  });
});

describe("resolveSkillMarkdown", () => {
  it("substitutes declared variables using stored values", () => {
    const skill = makeSkill({
      body: "stack={{stack}} pos={{has_pos}}",
      variables: [stackSelectVar, hasPosBoolVar],
    });
    const values: VariableValues = {
      "s1.stack": "nodejs",
      "s1.has_pos": true,
    };
    const result = resolveSkillMarkdown(skill, values, {});
    expect(result.body).toBe("stack=nodejs pos=true");
    expect(result.missing).toEqual([]);
  });

  it("inherits stack from questionnaire answers when no stored value", () => {
    const skill = makeSkill({
      body: "stack={{stack}}",
      variables: [stackSelectVar],
    });
    const answers: QuestionnaireAnswers = { stack: "python" };
    const result = resolveSkillMarkdown(skill, {}, answers);
    expect(result.body).toBe("stack=python");
    expect(result.missing).toEqual([]);
  });

  it("formats boolean false as the literal 'false'", () => {
    const skill = makeSkill({
      body: "pos={{has_pos}}",
      variables: [hasPosBoolVar],
    });
    const values: VariableValues = { "s1.has_pos": false };
    const result = resolveSkillMarkdown(skill, values, {});
    expect(result.body).toBe("pos=false");
  });

  it("reports a declared variable as missing when the value is undefined", () => {
    const skill = makeSkill({
      body: "stack={{stack}}",
      variables: [stackSelectVar],
    });
    const result = resolveSkillMarkdown(skill, {}, {});
    expect(result.body).toBe("stack={{stack}}");
    expect(result.missing).toEqual(["stack"]);
  });

  it("treats an explicitly-stored empty string as missing", () => {
    const skill = makeSkill({
      body: "stack={{stack}}",
      variables: [stackSelectVar],
    });
    const values: VariableValues = { "s1.stack": "" };
    const result = resolveSkillMarkdown(skill, values, {});
    expect(result.body).toBe("stack={{stack}}");
    expect(result.missing).toEqual(["stack"]);
  });

  it("reports a placeholder with no matching declared variable as missing", () => {
    const skill = makeSkill({
      body: "ghost={{ghost}}",
      variables: [],
    });
    const result = resolveSkillMarkdown(skill, {}, {});
    expect(result.missing).toEqual(["ghost"]);
    expect(result.body).toBe("ghost={{ghost}}");
  });

  it("deduplicates missing names across multiple occurrences", () => {
    const skill = makeSkill({
      body: "a {{stack}} b {{stack}}",
      variables: [stackSelectVar],
    });
    const result = resolveSkillMarkdown(skill, {}, {});
    expect(result.missing).toEqual(["stack"]);
  });

  it("is deterministic for the same inputs", () => {
    const skill = makeSkill({
      body: "s={{stack}} p={{has_pos}}",
      variables: [stackSelectVar, hasPosBoolVar],
    });
    const values: VariableValues = {
      "s1.stack": "nodejs",
      "s1.has_pos": false,
    };
    const a = resolveSkillMarkdown(skill, values, {});
    const b = resolveSkillMarkdown(skill, values, {});
    expect(a).toEqual(b);
  });

  it("returns the body untouched when there are no placeholders", () => {
    const skill = makeSkill({ body: "no vars here", variables: [] });
    const result = resolveSkillMarkdown(skill, {}, {});
    expect(result.body).toBe("no vars here");
    expect(result.missing).toEqual([]);
  });
});

describe("resolveSelectedSkills", () => {
  it("produces one resolution per input skill in order", () => {
    const a = makeSkill({ id: "a", slug: "a", body: "x" });
    const b = makeSkill({ id: "b", slug: "b", body: "y" });
    const result = resolveSelectedSkills([a, b], {}, {});
    expect(result.resolutions.map((r) => r.skillId)).toEqual(["a", "b"]);
  });

  it("surfaces every skill with missing variables", () => {
    const a = makeSkill({
      id: "a",
      slug: "a",
      name: { en: "A", ar: "A" },
      body: "{{stack}}",
      variables: [stackSelectVar],
    });
    const b = makeSkill({
      id: "b",
      slug: "b",
      name: { en: "B", ar: "B" },
      body: "ok",
      variables: [],
    });
    const c = makeSkill({
      id: "c",
      slug: "c",
      name: { en: "C", ar: "C" },
      body: "{{has_pos}}",
      variables: [hasPosBoolVar],
    });
    const result = resolveSelectedSkills([a, b, c], {}, {});
    expect(result.hasMissing).toBe(true);
    expect(result.skillsWithMissing.map((m) => m.skillId)).toEqual(["a", "c"]);
    expect(result.skillsWithMissing[0].variables).toEqual(["stack"]);
    expect(result.skillsWithMissing[0].name.en).toBe("A");
  });

  it("reports no missing when every declared variable has a value", () => {
    const a = makeSkill({
      id: "a",
      body: "{{stack}}",
      variables: [stackSelectVar],
    });
    const values: VariableValues = { "a.stack": "nodejs" };
    const result = resolveSelectedSkills([a], values, {});
    expect(result.hasMissing).toBe(false);
    expect(result.skillsWithMissing).toEqual([]);
  });
});
