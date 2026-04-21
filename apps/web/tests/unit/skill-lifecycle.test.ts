import { describe, expect, it } from "vitest";

import {
  canonicalSkillSchema,
  generatedSkillSchema,
  collectLifecycleCrossReferences,
  type CanonicalSkill,
} from "../../../../packages/skill-schema/src/index";
import { classifySkillDiff, type SkillSnapshotInput } from "../../../../scripts/lib/skill-diff";

function baseCanonical(overrides: Partial<CanonicalSkill> = {}): CanonicalSkill {
  return {
    id: "architecture-sample",
    name: { en: "Sample", ar: "نموذج" },
    summary: { en: "en-summary", ar: "ar-summary" },
    slug: "sample",
    version: "0.1.0",
    category: "architecture",
    region: null,
    targets: ["claude-code"],
    status: "draft",
    last_verified: "2026-01-01",
    maintainers: [{ github: "@a" }],
    sources: [{ title: "t", url: "https://example.test/", accessed: "2026-01-01" }],
    disclaimer: false,
    variables: [],
    triggers: [],
    lifecycle: "active",
    ...overrides,
  };
}

function baseSnapshot(overrides: Partial<SkillSnapshotInput> = {}): SkillSnapshotInput {
  return {
    id: "architecture-sample",
    slug: "sample",
    previousIds: [],
    version: "0.1.0",
    category: "architecture",
    region: null,
    status: "draft",
    disclaimer: false,
    lastVerified: "2026-01-01",
    name: { en: "Sample", ar: "نموذج" },
    summary: { en: "en-summary", ar: "ar-summary" },
    maintainers: [{ github: "@a" }],
    sources: [{ title: "t", url: "https://example.test/", accessed: "2026-01-01" }],
    targets: ["claude-code"],
    variables: [],
    triggers: [],
    body: "body",
    references: [],
    scripts: [],
    files: [],
    lifecycle: "active",
    replacementId: null,
    sunsetDate: null,
    lifecycleNote: null,
    ...overrides,
  };
}

describe("lifecycle schema", () => {
  it("defaults lifecycle to active when omitted", () => {
    const parsed = canonicalSkillSchema.parse({ ...baseCanonical(), lifecycle: undefined });
    expect(parsed.lifecycle).toBe("active");
  });

  it("accepts deprecated and archived lifecycles", () => {
    expect(() =>
      canonicalSkillSchema.parse({ ...baseCanonical(), lifecycle: "deprecated" }),
    ).not.toThrow();
    expect(() =>
      canonicalSkillSchema.parse({ ...baseCanonical(), lifecycle: "archived" }),
    ).not.toThrow();
  });

  it("rejects unknown lifecycle values", () => {
    const result = canonicalSkillSchema.safeParse({
      ...baseCanonical(),
      lifecycle: "mothballed",
    });
    expect(result.success).toBe(false);
  });

  it("rejects self-referential replacement_id", () => {
    const result = canonicalSkillSchema.safeParse({
      ...baseCanonical(),
      replacement_id: "architecture-sample",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a replacement_id that points at a different skill id", () => {
    expect(() =>
      canonicalSkillSchema.parse({
        ...baseCanonical(),
        replacement_id: "architecture-other",
      }),
    ).not.toThrow();
  });

  it("generated schema exposes camelCase lifecycle fields", () => {
    const parsed = generatedSkillSchema.parse({
      id: "architecture-sample",
      name: { en: "Sample", ar: "نموذج" },
      slug: "sample",
      version: "0.1.0",
      category: "architecture",
      region: null,
      targets: ["claude-code"],
      status: "draft",
      lastVerified: "2026-01-01",
      previousIds: [],
      maintainers: [{ github: "@a" }],
      sources: [{ title: "t", url: "https://example.test/", accessed: "2026-01-01" }],
      disclaimer: false,
      variables: [],
      triggers: [],
      body: "body",
      directory: "architecture/sample",
      files: [],
      references: [],
      scripts: [],
      lifecycle: "active",
    });
    expect(parsed.replacementId).toBeNull();
    expect(parsed.sunsetDate).toBeNull();
    expect(parsed.lifecycleNote).toBeNull();
  });
});

describe("collectLifecycleCrossReferences", () => {
  it("returns no issues when replacement_id points at an existing id", () => {
    const issues = collectLifecycleCrossReferences([
      { id: "skill-a", replacement_id: "skill-b" },
      { id: "skill-b" },
    ]);
    expect(issues).toEqual([]);
  });

  it("reports a missing replacement target", () => {
    const issues = collectLifecycleCrossReferences([
      { id: "skill-a", replacement_id: "does-not-exist" },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("replacement-missing");
  });

  it("reports a self-referential replacement target", () => {
    const issues = collectLifecycleCrossReferences([
      { id: "skill-a", replacement_id: "skill-a" },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("replacement-self");
  });
});

describe("lifecycle governance diff", () => {
  it("classifies lifecycle transitions as minor", () => {
    const result = classifySkillDiff(
      baseSnapshot(),
      baseSnapshot({ lifecycle: "deprecated" }),
    );
    expect(result.requiredBump).toBe("minor");
    expect(result.changes.some((c) => c.kind === "lifecycle-changed")).toBe(true);
  });

  it("classifies replacement pointer changes as minor", () => {
    const result = classifySkillDiff(
      baseSnapshot({ lifecycle: "deprecated" }),
      baseSnapshot({ lifecycle: "deprecated", replacementId: "architecture-other" }),
    );
    expect(result.requiredBump).toBe("minor");
    expect(result.changes.some((c) => c.kind === "replacement-id-changed")).toBe(true);
  });

  it("classifies sunset date edits as patch", () => {
    const result = classifySkillDiff(
      baseSnapshot({ lifecycle: "deprecated" }),
      baseSnapshot({ lifecycle: "deprecated", sunsetDate: "2026-12-31" }),
    );
    expect(result.requiredBump).toBe("patch");
    expect(result.changes.some((c) => c.kind === "sunset-date-changed")).toBe(true);
  });

  it("classifies lifecycle note edits as patch", () => {
    const result = classifySkillDiff(
      baseSnapshot({ lifecycle: "deprecated" }),
      baseSnapshot({
        lifecycle: "deprecated",
        lifecycleNote: { en: "Use skill-b instead.", ar: "استخدم skill-b بدلاً من ذلك." },
      }),
    );
    expect(result.requiredBump).toBe("patch");
    expect(result.changes.some((c) => c.kind === "lifecycle-note-edited")).toBe(true);
  });

  it("classifies archiving after deprecation as minor", () => {
    const result = classifySkillDiff(
      baseSnapshot({ lifecycle: "deprecated" }),
      baseSnapshot({ lifecycle: "archived" }),
    );
    expect(result.requiredBump).toBe("minor");
  });
});
