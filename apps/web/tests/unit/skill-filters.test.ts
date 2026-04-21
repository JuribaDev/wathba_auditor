import { describe, expect, it } from "vitest";

import type { GeneratedSkill } from "@/lib/skills/generated";
import { filterSkills, matchesCategory, matchesStatus } from "@/lib/skills/filters";

function makeSkill(overrides: Partial<GeneratedSkill>): GeneratedSkill {
  return {
    id: "seed",
    slug: "seed",
    name: { en: "Seed", ar: "بذرة" },
    version: "0.1.0",
    category: "security",
    region: null,
    targets: ["claude-code"],
    status: "draft",
    lastVerified: "2026-04-15",
    maintainers: [],
    sources: [],
    disclaimer: false,
    variables: [],
    triggers: [],
    body: "",
    directory: "seed",
    references: [],
    scripts: [],
    files: [],
    previousIds: [],
    lifecycle: "active",
    replacementId: null,
    sunsetDate: null,
    lifecycleNote: null,
    ...overrides,
  };
}

const saudi = makeSkill({
  id: "saudi",
  category: "compliance",
  region: "saudi-arabia",
  status: "draft",
});
const securityReviewed = makeSkill({
  id: "sec",
  category: "security",
  status: "maintainer-reviewed",
});
const architectureCommunity = makeSkill({
  id: "arch",
  category: "architecture",
  status: "community-maintained",
});
const skills = [saudi, securityReviewed, architectureCommunity];

describe("matchesCategory", () => {
  it("accepts any skill for 'all'", () => {
    for (const skill of skills) {
      expect(matchesCategory(skill, "all")).toBe(true);
    }
  });

  it("maps 'saudi' to region=saudi-arabia", () => {
    expect(matchesCategory(saudi, "saudi")).toBe(true);
    expect(matchesCategory(securityReviewed, "saudi")).toBe(false);
    expect(matchesCategory(architectureCommunity, "saudi")).toBe(false);
  });

  it("maps 'security' and 'architecture' to the canonical category field", () => {
    expect(matchesCategory(securityReviewed, "security")).toBe(true);
    expect(matchesCategory(architectureCommunity, "architecture")).toBe(true);
    expect(matchesCategory(saudi, "security")).toBe(false);
  });
});

describe("matchesStatus", () => {
  it("accepts any skill for 'all'", () => {
    for (const skill of skills) {
      expect(matchesStatus(skill, "all")).toBe(true);
    }
  });

  it("maps reviewed/community/draft to the canonical status values", () => {
    expect(matchesStatus(securityReviewed, "reviewed")).toBe(true);
    expect(matchesStatus(architectureCommunity, "community")).toBe(true);
    expect(matchesStatus(saudi, "draft")).toBe(true);
    expect(matchesStatus(saudi, "reviewed")).toBe(false);
  });
});

describe("filterSkills", () => {
  it("returns all skills when both filters are 'all'", () => {
    expect(filterSkills(skills, "all", "all")).toHaveLength(3);
  });

  it("narrows down by category and status", () => {
    expect(filterSkills(skills, "security", "reviewed")).toEqual([securityReviewed]);
    expect(filterSkills(skills, "saudi", "draft")).toEqual([saudi]);
  });

  it("produces an empty list when no skill matches", () => {
    expect(filterSkills(skills, "saudi", "reviewed")).toEqual([]);
  });
});
