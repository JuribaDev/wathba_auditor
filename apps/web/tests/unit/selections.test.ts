import { describe, expect, it } from "vitest";

import {
  addManualSelection,
  buildReviewRows,
  isSelectionSource,
  partitionLibraryForReview,
  seedAutoRecommendations,
  toggleSelection,
  type Selections,
} from "@/lib/questionnaire/selections";
import type { GeneratedSkill } from "@/lib/skills/generated";

function makeSkill(id: string, overrides: Partial<GeneratedSkill> = {}): GeneratedSkill {
  return {
    id,
    slug: id,
    category: "security",
    status: "reviewed",
    version: "1.0.0",
    lastVerified: "2026-01-01",
    name: { en: id, ar: id },
    summary: { en: "", ar: "" },
    disclaimer: false,
    targets: [],
    variables: [],
    references: [],
    scripts: [],
    sources: [],
    maintainers: [],
    bodies: {},
    ...(overrides as object),
  } as unknown as GeneratedSkill;
}

describe("isSelectionSource", () => {
  it("accepts known sources", () => {
    expect(isSelectionSource("auto")).toBe(true);
    expect(isSelectionSource("manual")).toBe(true);
  });
  it("rejects unknown values", () => {
    expect(isSelectionSource("other")).toBe(false);
    expect(isSelectionSource(undefined)).toBe(false);
    expect(isSelectionSource(42)).toBe(false);
  });
});

describe("toggleSelection", () => {
  it("creates a new entry with the fallback source when none exists", () => {
    const next = toggleSelection({}, "zatca-phase2", "auto");
    expect(next["zatca-phase2"]).toEqual({ on: true, source: "auto" });
  });

  it("flips `on` and preserves the provenance of an existing entry", () => {
    const prev: Selections = {
      "zatca-phase2": { on: true, source: "manual" },
    };
    const toggled = toggleSelection(prev, "zatca-phase2", "auto");
    expect(toggled["zatca-phase2"]).toEqual({ on: false, source: "manual" });
    const toggledBack = toggleSelection(toggled, "zatca-phase2", "auto");
    expect(toggledBack["zatca-phase2"]).toEqual({ on: true, source: "manual" });
  });

  it("does not mutate the previous object", () => {
    const prev: Selections = { a: { on: true, source: "auto" } };
    const next = toggleSelection(prev, "b", "manual");
    expect(prev).toEqual({ a: { on: true, source: "auto" } });
    expect(next).not.toBe(prev);
  });
});

describe("addManualSelection", () => {
  it("creates a manual entry when the skill is new", () => {
    const next = addManualSelection({}, "ci-hygiene");
    expect(next["ci-hygiene"]).toEqual({ on: true, source: "manual" });
  });

  it("flips `on` back to true while preserving an existing auto source", () => {
    const prev: Selections = { "ci-hygiene": { on: false, source: "auto" } };
    const next = addManualSelection(prev, "ci-hygiene");
    expect(next["ci-hygiene"]).toEqual({ on: true, source: "auto" });
  });

  it("keeps an existing manual entry at on:true without overwriting", () => {
    const prev: Selections = { x: { on: true, source: "manual" } };
    const next = addManualSelection(prev, "x");
    expect(next["x"]).toEqual({ on: true, source: "manual" });
  });
});

describe("seedAutoRecommendations", () => {
  it("adds entries for recommendations that are not yet selected", () => {
    const next = seedAutoRecommendations({}, [{ id: "a" }, { id: "b" }]);
    expect(next).toEqual({
      a: { on: true, source: "auto" },
      b: { on: true, source: "auto" },
    });
  });

  it("leaves existing entries untouched, regardless of source", () => {
    const prev: Selections = {
      a: { on: false, source: "auto" },
      b: { on: true, source: "manual" },
    };
    const next = seedAutoRecommendations(prev, [{ id: "a" }, { id: "b" }]);
    expect(next).toEqual(prev);
  });

  it("returns the same reference when nothing changes", () => {
    const prev: Selections = { a: { on: true, source: "auto" } };
    const next = seedAutoRecommendations(prev, [{ id: "a" }]);
    expect(next).toBe(prev);
  });
});

describe("buildReviewRows", () => {
  const a = makeSkill("a");
  const b = makeSkill("b");
  const c = makeSkill("c");

  it("merges recommendations and manual skills in order", () => {
    const rows = buildReviewRows([a, b], [c], {});
    expect(rows.map((r) => r.skill.id)).toEqual(["a", "b", "c"]);
    expect(rows[0]).toMatchObject({ on: true, source: "auto" });
    expect(rows[2]).toMatchObject({ on: true, source: "manual" });
  });

  it("uses stored selection state over the default source", () => {
    const rows = buildReviewRows([a], [c], {
      a: { on: false, source: "manual" },
      c: { on: false, source: "auto" },
    });
    expect(rows[0]).toEqual({ skill: a, on: false, source: "manual" });
    expect(rows[1]).toEqual({ skill: c, on: false, source: "auto" });
  });
});

describe("partitionLibraryForReview", () => {
  const a = makeSkill("a");
  const b = makeSkill("b");
  const c = makeSkill("c");
  const d = makeSkill("d");

  it("splits the catalog into manual and available buckets and excludes recommendations", () => {
    const { manualSkills, availableSkills } = partitionLibraryForReview(
      [a, b, c, d],
      [a],
      { c: { on: true, source: "manual" } },
    );
    expect(manualSkills.map((s) => s.id)).toEqual(["c"]);
    expect(availableSkills.map((s) => s.id)).toEqual(["b", "d"]);
  });

  it("treats an auto-sourced selection as available (not manual) once its recommendation is gone", () => {
    // A skill previously recommended may still carry source:"auto" after the
    // recommendation set changes. It belongs in `availableSkills`, not `manualSkills`.
    const { manualSkills, availableSkills } = partitionLibraryForReview(
      [a, b],
      [],
      { a: { on: false, source: "auto" } },
    );
    expect(manualSkills).toEqual([]);
    expect(availableSkills.map((s) => s.id)).toEqual(["a", "b"]);
  });
});
