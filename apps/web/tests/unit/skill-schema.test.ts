import { describe, expect, it } from "vitest";

import {
  canonicalSkillSchema,
  generatedSkillSchema,
  parseCanonicalSkill,
  skillVariableSchema,
  SkillValidationError,
  type CanonicalSkill,
  type GeneratedSkill,
} from "../../../../packages/skill-schema/src/index";

const validSkill: CanonicalSkill = {
  id: "saudi-zatca-phase2",
  name: { en: "ZATCA Phase 2", ar: "زاتكا المرحلة الثانية" },
  summary: { en: "Guardrails", ar: "ضوابط" },
  slug: "zatca-phase2",
  version: "0.1.0",
  category: "compliance",
  region: "saudi-arabia",
  targets: ["claude-code", "cursor"],
  status: "draft",
  last_verified: "2026-04-15",
  maintainers: [{ github: "@juriba" }],
  sources: [
    {
      title: "ZATCA",
      url: "https://zatca.gov.sa/",
      accessed: "2026-04-15",
    },
  ],
  disclaimer: true,
  variables: [
    {
      name: "stack",
      label: { en: "Stack", ar: "التقنية" },
      type: "select",
      options: ["nodejs", "dotnet"],
    },
  ],
  triggers: [{ when: { handles_invoicing: true } }],
};

describe("canonicalSkillSchema", () => {
  it("accepts a well-formed skill", () => {
    expect(() => canonicalSkillSchema.parse(validSkill)).not.toThrow();
  });

  it("requires at least one target", () => {
    const result = canonicalSkillSchema.safeParse({ ...validSkill, targets: [] });
    expect(result.success).toBe(false);
  });

  it("requires at least one source", () => {
    const result = canonicalSkillSchema.safeParse({ ...validSkill, sources: [] });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = canonicalSkillSchema.safeParse({
      ...validSkill,
      category: "marketing",
    });
    expect(result.success).toBe(false);
  });

  it("defaults variables and triggers to empty arrays", () => {
    const rest: Record<string, unknown> = { ...validSkill };
    delete rest.variables;
    delete rest.triggers;
    const parsed = canonicalSkillSchema.parse(rest);
    expect(parsed.variables).toEqual([]);
    expect(parsed.triggers).toEqual([]);
  });
});

describe("skillVariableSchema", () => {
  it("requires options for select variables", () => {
    const result = skillVariableSchema.safeParse({
      name: "stack",
      label: { en: "Stack", ar: "التقنية" },
      type: "select",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least one option/);
    }
  });

  it("forbids options on non-select variables", () => {
    const result = skillVariableSchema.safeParse({
      name: "flag",
      label: { en: "Flag", ar: "علم" },
      type: "boolean",
      options: ["yes"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects variable names with uppercase letters", () => {
    const result = skillVariableSchema.safeParse({
      name: "Stack",
      label: { en: "Stack", ar: "التقنية" },
      type: "text",
    });
    expect(result.success).toBe(false);
  });
});

describe("parseCanonicalSkill", () => {
  it("returns parsed data on success", () => {
    const parsed = parseCanonicalSkill(validSkill);
    expect(parsed.id).toBe("saudi-zatca-phase2");
  });

  it("throws SkillValidationError with a formatted message including the source", () => {
    try {
      parseCanonicalSkill(
        { ...validSkill, category: "marketing" },
        { source: "skills/saudi/bad/skill.yaml" },
      );
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(SkillValidationError);
      const err = error as SkillValidationError;
      expect(err.message).toContain("skills/saudi/bad/skill.yaml");
      expect(err.message).toContain("category");
      expect(err.source).toBe("skills/saudi/bad/skill.yaml");
      expect(err.issues.length).toBeGreaterThan(0);
    }
  });

  it("formats errors without a source when none is provided", () => {
    try {
      parseCanonicalSkill({});
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(SkillValidationError);
      expect((error as SkillValidationError).message).toMatch(
        /^Invalid skill metadata:/,
      );
    }
  });
});

describe("generatedSkillSchema", () => {
  it("accepts a generated skill with references and scripts", () => {
    const rest: Record<string, unknown> = { ...validSkill };
    delete rest.last_verified;
    const generated: GeneratedSkill = generatedSkillSchema.parse({
      ...rest,
      lastVerified: "2026-04-15",
      body: "# Skill body",
      directory: "saudi/zatca-phase2",
      references: [{ path: "zatca-xml-sample.xml", content: "<xml/>" }],
      scripts: [
        { path: "validate-zatca-xml.mjs", content: "export default () => {};" },
      ],
    });
    expect(generated.references).toHaveLength(1);
    expect(generated.scripts).toHaveLength(1);
    expect(generated.lastVerified).toBe("2026-04-15");
  });

  it("rejects a generated skill missing a body", () => {
    const rest: Record<string, unknown> = { ...validSkill };
    delete rest.last_verified;
    const result = generatedSkillSchema.safeParse({
      ...rest,
      lastVerified: "2026-04-15",
      directory: "saudi/zatca-phase2",
      references: [],
      scripts: [],
    });
    expect(result.success).toBe(false);
  });
});
