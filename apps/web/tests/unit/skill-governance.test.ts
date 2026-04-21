import { describe, expect, it } from "vitest";

import { classifyActualBump, stricterBump } from "../../../../scripts/lib/skill-bump";
import { classifySkillDiff } from "../../../../scripts/lib/skill-diff";
import type { SkillSnapshotInput } from "../../../../scripts/lib/skill-diff";
import {
  DEFAULT_COMPLIANCE_FRESHNESS,
  evaluateComplianceFreshness,
} from "../../../../scripts/lib/compliance-freshness";
import {
  findUnresolvedMigrations,
  pairSkills,
} from "../../../../scripts/lib/skill-pairing";

function baseSnapshot(overrides: Partial<SkillSnapshotInput> = {}): SkillSnapshotInput {
  return {
    id: "saudi-pdpl-basics",
    slug: "pdpl-basics",
    previousIds: [],
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
    // Prerelease identifiers are compared per SemVer §11.4
    ["1.0.0-alpha.1", "1.0.0-alpha.2", "patch"],
    ["1.0.0-alpha.2", "1.0.0-alpha.1", "regressed"],
    ["1.0.0-alpha", "1.0.0-alpha.1", "patch"],
    ["1.0.0-alpha", "1.0.0-beta", "patch"],
    ["1.0.0-rc.1", "1.0.0", "patch"],
    ["1.0.0", "1.0.0-rc.1", "regressed"],
    // Build metadata is ignored per SemVer §10
    ["1.0.0", "1.0.0+20260420", "none"],
    ["1.0.0+a", "1.0.0+b", "none"],
    ["1.0.0-rc.1+x", "1.0.0-rc.1+y", "none"],
    // Prerelease promotion combined with core bump
    ["1.0.0-rc.1", "1.1.0", "minor"],
    ["1.0.0-rc.1", "2.0.0", "major"],
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

  it("treats adding an asset outside references/scripts as minor-required", () => {
    const before = baseSnapshot({ files: [] });
    const after = baseSnapshot({
      files: [{ path: "assets/logo.svg", content: "<svg/>" }],
    });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("minor");
    expect(result.changes.some((c) => c.kind === "file-added")).toBe(true);
  });

  it("treats editing a template file as patch-required", () => {
    const before = baseSnapshot({
      files: [{ path: "templates/invoice.xml", content: "<v1/>" }],
    });
    const after = baseSnapshot({
      files: [{ path: "templates/invoice.xml", content: "<v2/>" }],
    });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("patch");
    expect(
      result.changes.some(
        (c) => c.kind === "file-edited" && c.reason.includes("templates/invoice.xml"),
      ),
    ).toBe(true);
  });

  it("treats editing agents/openai.yaml as patch-required", () => {
    const before = baseSnapshot({
      files: [
        {
          path: "agents/openai.yaml",
          content: "interface:\n  display_name: Old\n",
        },
      ],
    });
    const after = baseSnapshot({
      files: [
        {
          path: "agents/openai.yaml",
          content: "interface:\n  display_name: New\n",
        },
      ],
    });
    const result = classifySkillDiff(before, after);
    expect(result.requiredBump).toBe("patch");
  });

  it("does not double-count a references/* entry that also appears in files", () => {
    // Snapshots built from the new loader carry references/foo.md in BOTH
    // `references` (as "foo.md") and `files` (as "references/foo.md"). The
    // diff's extras filter strips references/* and scripts/* out of the
    // files bucket so we don't emit two changes for one edit.
    const before = baseSnapshot({
      references: [{ path: "checklist.md", content: "a" }],
      files: [{ path: "references/checklist.md", content: "a" }],
    });
    const after = baseSnapshot({
      references: [{ path: "checklist.md", content: "b" }],
      files: [{ path: "references/checklist.md", content: "b" }],
    });
    const result = classifySkillDiff(before, after);
    const editKinds = result.changes.map((c) => c.kind);
    expect(editKinds).toContain("references-edited");
    expect(editKinds).not.toContain("file-edited");
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

describe("pairSkills matcher", () => {
  function toMaps(snaps: SkillSnapshotInput[], dirs: string[]) {
    const byDir = new Map<string, SkillSnapshotInput>();
    const byId = new Map<string, SkillSnapshotInput>();
    for (let i = 0; i < snaps.length; i += 1) {
      byDir.set(dirs[i], snaps[i]);
      byId.set(snaps[i].id, snaps[i]);
    }
    return { byDir, byId };
  }

  it("pairs an in-place edit at the same directory", () => {
    const old = baseSnapshot();
    const current = baseSnapshot({ version: "0.2.1" });
    const oldMaps = toMaps([old], ["skills/saudi/pdpl-basics"]);
    const currentMaps = toMaps([current], ["skills/saudi/pdpl-basics"]);
    const pairs = pairSkills({
      changedDirectories: ["skills/saudi/pdpl-basics"],
      currentByDirectory: currentMaps.byDir,
      currentById: currentMaps.byId,
      oldByDirectory: oldMaps.byDir,
      oldById: oldMaps.byId,
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0].kind).toBe("compared");
    if (pairs[0].kind === "compared") {
      expect(pairs[0].renamed).toBe(false);
      expect(pairs[0].idChanged).toBe(false);
    }
  });

  it("pairs an in-place id change at the same directory (id change path)", () => {
    const old = baseSnapshot({ id: "saudi-pdpl-basics" });
    const current = baseSnapshot({ id: "ksa-pdpl-basics" });
    const oldMaps = toMaps([old], ["skills/saudi/pdpl-basics"]);
    const currentMaps = toMaps([current], ["skills/saudi/pdpl-basics"]);
    const pairs = pairSkills({
      changedDirectories: ["skills/saudi/pdpl-basics"],
      currentByDirectory: currentMaps.byDir,
      currentById: currentMaps.byId,
      oldByDirectory: oldMaps.byDir,
      oldById: oldMaps.byId,
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0].kind).toBe("compared");
    if (pairs[0].kind === "compared") {
      expect(pairs[0].idChanged).toBe(true);
      expect(pairs[0].old.id).toBe("saudi-pdpl-basics");
      expect(pairs[0].current.id).toBe("ksa-pdpl-basics");
    }
  });

  it("pairs a slug/folder rename via id match", () => {
    const old = baseSnapshot({ id: "saudi-pdpl-basics" });
    const current = baseSnapshot({ id: "saudi-pdpl-basics", slug: "pdpl-v2" });
    const oldMaps = toMaps([old], ["skills/saudi/pdpl-basics"]);
    const currentMaps = toMaps([current], ["skills/saudi/pdpl-v2"]);
    const pairs = pairSkills({
      changedDirectories: ["skills/saudi/pdpl-basics", "skills/saudi/pdpl-v2"],
      currentByDirectory: currentMaps.byDir,
      currentById: currentMaps.byId,
      oldByDirectory: oldMaps.byDir,
      oldById: oldMaps.byId,
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0].kind).toBe("compared");
    if (pairs[0].kind === "compared") {
      expect(pairs[0].renamed).toBe(true);
      expect(pairs[0].oldDirectory).toBe("skills/saudi/pdpl-basics");
      expect(pairs[0].currentDirectory).toBe("skills/saudi/pdpl-v2");
    }
  });

  it("reports a genuinely new skill", () => {
    const current = baseSnapshot({ id: "brand-new" });
    const currentMaps = toMaps([current], ["skills/saudi/brand-new"]);
    const pairs = pairSkills({
      changedDirectories: ["skills/saudi/brand-new"],
      currentByDirectory: currentMaps.byDir,
      currentById: currentMaps.byId,
      oldByDirectory: new Map(),
      oldById: new Map(),
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0].kind).toBe("new");
  });

  it("reports a truly removed skill", () => {
    const old = baseSnapshot({ id: "gone" });
    const oldMaps = toMaps([old], ["skills/saudi/gone"]);
    const pairs = pairSkills({
      changedDirectories: ["skills/saudi/gone"],
      currentByDirectory: new Map(),
      currentById: new Map(),
      oldByDirectory: oldMaps.byDir,
      oldById: oldMaps.byId,
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0].kind).toBe("removed");
  });

  it("pairs a combined id+slug+body rewrite via explicit previous_id (pass 2)", () => {
    const old = baseSnapshot({
      id: "old-id",
      slug: "old-slug",
      body: "# Old\n\nOriginal content.\n",
    });
    const current = baseSnapshot({
      id: "new-id",
      slug: "new-slug",
      previousIds: ["old-id"],
      body: "# New\n\nCompletely rewritten content.\n",
    });
    const oldMaps = toMaps([old], ["skills/saudi/old-slug"]);
    const currentMaps = toMaps([current], ["skills/saudi/new-slug"]);
    const pairs = pairSkills({
      changedDirectories: [
        "skills/saudi/old-slug",
        "skills/saudi/new-slug",
      ],
      currentByDirectory: currentMaps.byDir,
      currentById: currentMaps.byId,
      oldByDirectory: oldMaps.byDir,
      oldById: oldMaps.byId,
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0].kind).toBe("compared");
    if (pairs[0].kind === "compared") {
      expect(pairs[0].idChanged).toBe(true);
      expect(pairs[0].renamed).toBe(true);
      expect(pairs[0].old.id).toBe("old-id");
      expect(pairs[0].current.id).toBe("new-id");
    }
  });

  it("pairs a combined id+slug migration via body match (pass 5)", () => {
    const old = baseSnapshot({
      id: "old-id",
      slug: "old-slug",
      body: "# Shared\n\nSame content preserved across the rename.\n",
    });
    const current = baseSnapshot({
      id: "new-id",
      slug: "new-slug",
      body: "# Shared\n\nSame content preserved across the rename.\n",
    });
    const oldMaps = toMaps([old], ["skills/saudi/old-slug"]);
    const currentMaps = toMaps([current], ["skills/saudi/new-slug"]);
    const pairs = pairSkills({
      changedDirectories: [
        "skills/saudi/old-slug",
        "skills/saudi/new-slug",
      ],
      currentByDirectory: currentMaps.byDir,
      currentById: currentMaps.byId,
      oldByDirectory: oldMaps.byDir,
      oldById: oldMaps.byId,
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0].kind).toBe("compared");
    if (pairs[0].kind === "compared") {
      expect(pairs[0].idChanged).toBe(true);
      expect(pairs[0].renamed).toBe(true);
      expect(pairs[0].old.id).toBe("old-id");
      expect(pairs[0].current.id).toBe("new-id");
    }
  });

  it("does not merge a genuine delete+add when bodies differ", () => {
    const removed = baseSnapshot({
      id: "removed-skill",
      body: "# Removed\n\nContent unique to the deleted skill.\n",
    });
    const added = baseSnapshot({
      id: "added-skill",
      slug: "added-slug",
      body: "# Added\n\nContent unique to the new skill.\n",
    });
    const oldMaps = toMaps([removed], ["skills/saudi/removed-slug"]);
    const currentMaps = toMaps([added], ["skills/saudi/added-slug"]);
    const pairs = pairSkills({
      changedDirectories: [
        "skills/saudi/removed-slug",
        "skills/saudi/added-slug",
      ],
      currentByDirectory: currentMaps.byDir,
      currentById: currentMaps.byId,
      oldByDirectory: oldMaps.byDir,
      oldById: oldMaps.byId,
    });
    const kinds = pairs.map((pair) => pair.kind).sort();
    expect(kinds).toEqual(["new", "removed"]);
  });

  it("leaves id+slug+body rewrites WITHOUT previous_id as new+removed (surfaces unresolved migration)", () => {
    const old = baseSnapshot({
      id: "old-id",
      slug: "old-slug",
      body: "# Old\n\nOld content.\n",
    });
    const current = baseSnapshot({
      id: "new-id",
      slug: "new-slug",
      body: "# New\n\nNew content.\n",
    });
    const oldMaps = toMaps([old], ["skills/saudi/old-slug"]);
    const currentMaps = toMaps([current], ["skills/saudi/new-slug"]);
    const pairs = pairSkills({
      changedDirectories: [
        "skills/saudi/old-slug",
        "skills/saudi/new-slug",
      ],
      currentByDirectory: currentMaps.byDir,
      currentById: currentMaps.byId,
      oldByDirectory: oldMaps.byDir,
      oldById: oldMaps.byId,
    });
    const kinds = pairs.map((pair) => pair.kind).sort();
    expect(kinds).toEqual(["new", "removed"]);
  });

  it("emits a skill only once even when it appears at old and new paths", () => {
    // Rename path: both the old dir and new dir show up in changedDirectories
    // because file-level diff sees D+A for every file under them.
    const old = baseSnapshot({ id: "x" });
    const current = baseSnapshot({ id: "x", slug: "y" });
    const oldMaps = toMaps([old], ["skills/saudi/x"]);
    const currentMaps = toMaps([current], ["skills/saudi/y"]);
    const pairs = pairSkills({
      changedDirectories: ["skills/saudi/x", "skills/saudi/y"],
      currentByDirectory: currentMaps.byDir,
      currentById: currentMaps.byId,
      oldByDirectory: oldMaps.byDir,
      oldById: oldMaps.byId,
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0].kind).toBe("compared");
  });
});

describe("findUnresolvedMigrations", () => {
  it("returns null when pairs contain only compared entries", () => {
    const result = findUnresolvedMigrations([
      {
        kind: "compared",
        current: baseSnapshot(),
        old: baseSnapshot(),
        currentDirectory: "skills/x/y",
        oldDirectory: "skills/x/y",
        renamed: false,
        idChanged: false,
      },
    ]);
    expect(result).toBeNull();
  });

  it("returns null when only new entries remain (no ambiguous migration)", () => {
    const result = findUnresolvedMigrations([
      {
        kind: "new",
        current: baseSnapshot(),
        currentDirectory: "skills/x/y",
      },
    ]);
    expect(result).toBeNull();
  });

  it("surfaces an unresolved migration when both new and removed entries exist", () => {
    const added = baseSnapshot({ id: "new-one" });
    const removed = baseSnapshot({ id: "old-one" });
    const result = findUnresolvedMigrations([
      { kind: "new", current: added, currentDirectory: "skills/x/new" },
      { kind: "removed", old: removed, oldDirectory: "skills/x/old" },
    ]);
    expect(result).not.toBeNull();
    expect(result?.added[0].id).toBe("new-one");
    expect(result?.removed[0].id).toBe("old-one");
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
