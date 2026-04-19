import { describe, expect, it } from "vitest";

import { classifyActualBump, stricterBump } from "../../../../scripts/lib/skill-bump";
import { classifySkillDiff } from "../../../../scripts/lib/skill-diff";
import type { SkillSnapshotInput } from "../../../../scripts/lib/skill-diff";
import {
  DEFAULT_COMPLIANCE_FRESHNESS,
  evaluateComplianceFreshness,
} from "../../../../scripts/lib/compliance-freshness";

function baseSnapshot(overrides: Partial<SkillSnapshotInput> = {}): SkillSnapshotInput {
  return {
    id: "saudi-pdpl-basics",
    slug: "pdpl-basics",
    version: "0.2.0",
    category: "compliance",
    region: "saudi-arabia",
    status: "community-maintained",
    disclaimer: true,
    lastVerified: "2026-02-04",
    name: { en: "PDPL Basics", ar: "أساسيات" },
    summary: { en: "Summary en", ar: "ملخص عربي" },
    maintainers: [{ github: "@layla" }],
    sources: [
      { title: "SDAIA", url: "https://sdaia.gov.sa/x", accessed: "2026-02-04" },
    ],
    targets: ["claude-code", "cursor"],
    variables: [
      {
        name: "handles_pii",
        label: { en: "Handles PII", ar: "يتعامل مع البيانات" },
        type: "boolean",
      },
    ],
    triggers: [{ when: { handles_pii: true } }],
    body: "# PDPL\n\nBody.\n",
    references: [{ path: "checklist.md", content: "content-a" }],
    scripts: [],
    ...overrides,
  };
}

describe("classifyActualBump", () => {
  it.each([
    ["0.2.0", "0.2.0", "none"],
    ["0.2.0", "0.2.1", "patch"],
    ["0.2.0", "0.3.0", "minor"],
    ["0.2.0", "1.0.0", "major"],
    ["0.2.0", "0.1.9", "regressed"],
    ["garbage", "0.1.0", "invalid"],
  ])("classifies %s → %s as %s", (previous, next, expected) => {
    expect(classifyActualBump(previous, next)).toBe(expected);
  });
});

describe("stricterBump", () => {
  it("returns the higher-ranked bump", () => {
    expect(stricterBump("patch", "minor")).toBe("minor");
    expect(stricterBump("major", "minor")).toBe("major");
    expect(stricterBump("none", "patch")).toBe("patch");
  });
});

describe("classifySkillDiff", () => {
  it("detects SKILL.md body changes as patch-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({ body: "# PDPL\n\nNew body.\n" });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("patch");
    expect(result.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "body-edited", requires: "patch" }),
      ]),
    );
  });

  it("detects adding a variable as minor-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({
      variables: [
        ...before.variables,
        {
          name: "target_market",
          label: { en: "Target market", ar: "السوق" },
          type: "select",
          options: ["saudi_arabia", "gcc"],
        },
      ],
    });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("minor");
    expect(result.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "variable-added", requires: "minor" }),
      ]),
    );
  });

  it("detects removing a variable as major-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({ variables: [] });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("major");
    expect(result.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "variable-removed-or-renamed",
          requires: "major",
        }),
      ]),
    );
  });

  it("treats renaming a variable as major-required (remove + add)", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({
      variables: [
        {
          name: "processes_pii",
          label: before.variables[0].label,
          type: "boolean",
        },
      ],
    });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("major");
    expect(result.changes.some((c) => c.kind === "variable-removed-or-renamed")).toBe(
      true,
    );
    expect(result.changes.some((c) => c.kind === "variable-added")).toBe(true);
  });

  it("treats slug change as major-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({ slug: "pdpl-basics-v2" });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("major");
  });

  it("treats id change as major-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({ id: "ksa-pdpl-basics" });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("major");
  });

  it("treats removing a target as major-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({ targets: ["claude-code"] });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("major");
  });

  it("treats adding a target as minor-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({ targets: [...before.targets, "codex"] });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("minor");
  });

  it("treats adding a reference file as minor-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({
      references: [
        ...before.references,
        { path: "extra.md", content: "new ref" },
      ],
    });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("minor");
  });

  it("treats editing a reference file content as patch-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({
      references: [{ path: "checklist.md", content: "content-b" }],
    });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("patch");
  });

  it("treats last_verified, sources, and status edits as patch-required", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({
      lastVerified: "2026-04-19",
      sources: [
        { title: "SDAIA", url: "https://sdaia.gov.sa/x", accessed: "2026-04-19" },
      ],
      status: "maintainer-reviewed",
    });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("patch");
  });

  it("takes the strictest required bump when multiple classes apply", () => {
    const before = baseSnapshot();
    const after = baseSnapshot({
      body: "# PDPL\n\nPatch edit.\n",
      slug: "pdpl-basics-v2",
    });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("major");
  });

  it("reports no required bump when nothing schema-visible changed", () => {
    const before = baseSnapshot();
    const after = baseSnapshot();
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("none");
    expect(result.changes).toHaveLength(0);
  });
});

describe("evaluateComplianceFreshness", () => {
  const now = new Date("2026-04-19T00:00:00Z");
  const config = { ...DEFAULT_COMPLIANCE_FRESHNESS, now };

  it("passes a fresh compliance skill", () => {
    const result = evaluateComplianceFreshness(
      {
        id: "s",
        slug: "s",
        category: "compliance",
        disclaimer: true,
        lastVerified: "2026-02-04",
        sources: [
          { title: "X", url: "https://x.example", accessed: "2026-02-04" },
        ],
      },
      config,
    );
    expect(result.issues).toEqual([]);
  });

  it("fails a compliance skill with stale last_verified", () => {
    const result = evaluateComplianceFreshness(
      {
        id: "s",
        slug: "s",
        category: "compliance",
        disclaimer: true,
        lastVerified: "2024-01-01",
        sources: [
          { title: "X", url: "https://x.example", accessed: "2026-02-04" },
        ],
      },
      config,
    );
    expect(result.issues.some((i) => i.code === "last-verified-stale")).toBe(true);
  });

  it("fails a compliance skill with stale source accessed date", () => {
    const result = evaluateComplianceFreshness(
      {
        id: "s",
        slug: "s",
        category: "compliance",
        disclaimer: true,
        lastVerified: "2026-02-04",
        sources: [
          { title: "X", url: "https://x.example", accessed: "2023-01-01" },
        ],
      },
      config,
    );
    expect(result.issues.some((i) => i.code === "source-accessed-stale")).toBe(
      true,
    );
  });

  it("fails a compliance skill missing the disclaimer", () => {
    const result = evaluateComplianceFreshness(
      {
        id: "s",
        slug: "s",
        category: "compliance",
        disclaimer: false,
        lastVerified: "2026-02-04",
        sources: [
          { title: "X", url: "https://x.example", accessed: "2026-02-04" },
        ],
      },
      config,
    );
    expect(result.issues.some((i) => i.code === "missing-disclaimer")).toBe(true);
  });

  it("does not flag non-compliance skills", () => {
    const result = evaluateComplianceFreshness(
      {
        id: "s",
        slug: "s",
        category: "security",
        disclaimer: false,
        lastVerified: "2023-01-01",
        sources: [],
      },
      config,
    );
    expect(result.issues).toEqual([]);
  });
});

describe("bump enforcement scenarios (end-to-end policy matrix)", () => {
  const baseVersion = "0.2.0";

  const cases: Array<{
    name: string;
    mutate: (snap: SkillSnapshotInput) => SkillSnapshotInput;
    newVersion: string;
    shouldPass: boolean;
  }> = [
    {
      name: "SKILL.md changed with no version bump → fail",
      mutate: (s) => ({ ...s, body: `${s.body}\n\nupdate` }),
      newVersion: baseVersion,
      shouldPass: false,
    },
    {
      name: "metadata-only change with patch bump → pass",
      mutate: (s) => ({ ...s, status: "maintainer-reviewed" }),
      newVersion: "0.2.1",
      shouldPass: true,
    },
    {
      name: "variable added with patch bump only → fail",
      mutate: (s) => ({
        ...s,
        variables: [
          ...s.variables,
          {
            name: "new_var",
            label: { en: "New", ar: "جديد" },
            type: "boolean",
          },
        ],
      }),
      newVersion: "0.2.1",
      shouldPass: false,
    },
    {
      name: "variable added with minor bump → pass",
      mutate: (s) => ({
        ...s,
        variables: [
          ...s.variables,
          {
            name: "new_var",
            label: { en: "New", ar: "جديد" },
            type: "boolean",
          },
        ],
      }),
      newVersion: "0.3.0",
      shouldPass: true,
    },
    {
      name: "variable renamed with minor bump only → fail",
      mutate: (s) => ({
        ...s,
        variables: [
          {
            name: "renamed_var",
            label: { en: "Renamed", ar: "جديد" },
            type: "boolean",
          },
        ],
      }),
      newVersion: "0.3.0",
      shouldPass: false,
    },
    {
      name: "slug change with minor bump only → fail",
      mutate: (s) => ({ ...s, slug: "pdpl-renamed" }),
      newVersion: "0.3.0",
      shouldPass: false,
    },
    {
      name: "slug change with major bump → pass",
      mutate: (s) => ({ ...s, slug: "pdpl-renamed" }),
      newVersion: "1.0.0",
      shouldPass: true,
    },
  ];

  it.each(cases)("$name", ({ mutate, newVersion, shouldPass }) => {
    const before = baseSnapshot();
    const after = mutate(baseSnapshot({ version: newVersion }));
    const diff = classifySkillDiff(before, after);
    const actual = classifyActualBump(before.version, newVersion);
    const satisfied =
      typeof actual === "string" && actual !== "invalid" && actual !== "regressed"
        ? classifyActualBumpRank(actual) >= classifyActualBumpRank(diff.requiredBump)
        : false;
    expect(satisfied).toBe(shouldPass);
  });
});

function classifyActualBumpRank(level: string): number {
  switch (level) {
    case "none":
      return 0;
    case "patch":
      return 1;
    case "minor":
      return 2;
    case "major":
      return 3;
    default:
      return -1;
  }
}
