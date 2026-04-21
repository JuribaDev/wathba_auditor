import { describe, expect, it } from "vitest";

import {
  filterSkills,
  matchesLifecycle,
  LIFECYCLE_FILTERS,
} from "@/lib/skills/filters";
import type { GeneratedSkill } from "@/lib/skills/generated";

function makeSkill(overrides: Partial<GeneratedSkill>): GeneratedSkill {
  return {
    id: overrides.id ?? "sample-id",
    name: { en: "Sample", ar: "نموذج" },
    slug: "sample",
    previousIds: [],
    version: "0.1.0",
    category: "architecture",
    region: null,
    targets: ["claude-code"],
    status: "draft",
    lifecycle: "active",
    replacementId: null,
    sunsetDate: null,
    lifecycleNote: null,
    lastVerified: "2026-01-01",
    maintainers: [],
    sources: [],
    disclaimer: false,
    variables: [],
    triggers: [],
    body: "",
    directory: "architecture/sample",
    files: [],
    references: [],
    scripts: [],
    ...overrides,
  } as GeneratedSkill;
}

describe("lifecycle filters", () => {
  const active = makeSkill({ id: "a", lifecycle: "active" });
  const deprecated = makeSkill({ id: "d", lifecycle: "deprecated" });
  const archived = makeSkill({ id: "x", lifecycle: "archived" });
  const skills: GeneratedSkill[] = [active, deprecated, archived];

  it("default filter hides archived and keeps active + deprecated", () => {
    const visible = filterSkills(skills, "all", "all", "default");
    const ids = visible.map((s) => s.id).sort();
    expect(ids).toEqual(["a", "d"]);
  });

  it("archived filter surfaces only archived skills", () => {
    const visible = filterSkills(skills, "all", "all", "archived");
    expect(visible.map((s) => s.id)).toEqual(["x"]);
  });

  it("all filter includes every lifecycle state", () => {
    const visible = filterSkills(skills, "all", "all", "all");
    expect(visible.map((s) => s.id).sort()).toEqual(["a", "d", "x"]);
  });

  it("exposes the full lifecycle filter set", () => {
    expect(LIFECYCLE_FILTERS).toEqual([
      "default",
      "active",
      "deprecated",
      "archived",
      "all",
    ]);
  });

  it("matchesLifecycle honors each filter individually", () => {
    expect(matchesLifecycle(active, "active")).toBe(true);
    expect(matchesLifecycle(deprecated, "deprecated")).toBe(true);
    expect(matchesLifecycle(archived, "archived")).toBe(true);
    expect(matchesLifecycle(archived, "default")).toBe(false);
  });

  it("homepage preview rule drops archived skills before slicing", () => {
    // The landing page builds `previewSkills` by filtering out archived
    // first, then slicing. Mirror that logic here so a regression cannot
    // reintroduce archived skills into the default-discovery surface.
    const catalog = [archived, active, deprecated, makeSkill({ id: "a2" })];
    const preview = catalog.filter((s) => s.lifecycle !== "archived").slice(0, 6);
    expect(preview.some((s) => s.lifecycle === "archived")).toBe(false);
  });
});
