import { describe, expect, it } from "vitest";
import type { GeneratedSkill } from "@/lib/skills/generated";
import {
  recommendSkillSlugs,
  recommendSkills,
} from "@/lib/skills/recommendations";

describe("recommendSkillSlugs", () => {
  it("always includes testability-check", () => {
    expect(recommendSkillSlugs({})).toContain("testability-check");
    expect(recommendSkillSlugs(undefined)).toContain("testability-check");
    expect(recommendSkillSlugs(null)).toContain("testability-check");
  });

  it("recommends zatca-phase2 for KSA + invoicing", () => {
    expect(
      recommendSkillSlugs({ market: "ksa", invoicing: true }),
    ).toContain("zatca-phase2");
    expect(
      recommendSkillSlugs({ market: "gcc", invoicing: true }),
    ).toContain("zatca-phase2");
    expect(
      recommendSkillSlugs({ market: "global", invoicing: true }),
    ).not.toContain("zatca-phase2");
  });

  it("recommends pdpl-basics for KSA/GCC + PII", () => {
    expect(recommendSkillSlugs({ market: "ksa", pii: true })).toContain(
      "pdpl-basics",
    );
    expect(recommendSkillSlugs({ market: "gcc", pii: true })).toContain(
      "pdpl-basics",
    );
    expect(recommendSkillSlugs({ market: "other", pii: true })).not.toContain(
      "pdpl-basics",
    );
  });

  it("recommends nafath-yakeen-basics for KSA/GCC + identity", () => {
    expect(
      recommendSkillSlugs({ market: "ksa", identity: true }),
    ).toContain("nafath-yakeen-basics");
    expect(
      recommendSkillSlugs({ market: "global", identity: true }),
    ).not.toContain("nafath-yakeen-basics");
  });

  it("recommends mada-stcpay-basics for KSA/GCC + payments", () => {
    expect(
      recommendSkillSlugs({ market: "ksa", payments: true }),
    ).toContain("mada-stcpay-basics");
    expect(
      recommendSkillSlugs({ market: "other", payments: true }),
    ).not.toContain("mada-stcpay-basics");
  });

  it("recommends secrets-baseline when secrets handling is not a manager", () => {
    expect(recommendSkillSlugs({ secrets: "env" })).toContain(
      "secrets-baseline",
    );
    expect(recommendSkillSlugs({ secrets: "dotenv" })).toContain(
      "secrets-baseline",
    );
    expect(recommendSkillSlugs({ secrets: "none" })).toContain(
      "secrets-baseline",
    );
    expect(recommendSkillSlugs({ secrets: "manager" })).not.toContain(
      "secrets-baseline",
    );
    expect(recommendSkillSlugs({})).not.toContain("secrets-baseline");
  });

  it("recommends auth-isolation when identity or PII is present regardless of market", () => {
    expect(recommendSkillSlugs({ identity: true })).toContain("auth-isolation");
    expect(recommendSkillSlugs({ pii: true })).toContain("auth-isolation");
    expect(recommendSkillSlugs({ market: "global", pii: true })).toContain(
      "auth-isolation",
    );
    expect(recommendSkillSlugs({})).not.toContain("auth-isolation");
  });

  it("recommends ci-hygiene when CI is missing or false, but not when true", () => {
    expect(recommendSkillSlugs({ ci: false })).toContain("ci-hygiene");
    expect(recommendSkillSlugs({})).toContain("ci-hygiene");
    expect(recommendSkillSlugs({ ci: true })).not.toContain("ci-hygiene");
  });

  it("orders recommendations saudi, then security, then architecture", () => {
    const result = recommendSkillSlugs({
      market: "ksa",
      invoicing: true,
      pii: true,
      identity: true,
      payments: true,
      secrets: "env",
      ci: false,
    });
    expect(result).toEqual([
      "zatca-phase2",
      "pdpl-basics",
      "nafath-yakeen-basics",
      "mada-stcpay-basics",
      "secrets-baseline",
      "auth-isolation",
      "ci-hygiene",
      "testability-check",
    ]);
  });

  it("groups saudi before security before architecture", () => {
    const buckets = {
      "zatca-phase2": "saudi",
      "pdpl-basics": "saudi",
      "nafath-yakeen-basics": "saudi",
      "mada-stcpay-basics": "saudi",
      "secrets-baseline": "security",
      "auth-isolation": "security",
      "testability-check": "architecture",
      "ci-hygiene": "architecture",
    } as const;
    const rank = { saudi: 0, security: 1, architecture: 2 } as const;
    const result = recommendSkillSlugs({
      market: "ksa",
      invoicing: true,
      pii: true,
      identity: true,
      payments: true,
      secrets: "env",
      ci: false,
    });
    const ranks = result.map((slug) => rank[buckets[slug]]);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
    }
  });

  it("returns a deduplicated set", () => {
    const result = recommendSkillSlugs({
      market: "ksa",
      identity: true,
      pii: true,
    });
    expect(new Set(result).size).toBe(result.length);
  });
});

describe("recommendSkills", () => {
  const fakeCatalog: GeneratedSkill[] = [
    {
      id: "saudi-zatca-phase2",
      name: { en: "ZATCA", ar: "زاتكا" },
      slug: "zatca-phase2",
      version: "0.1.0",
      category: "compliance",
      region: "saudi-arabia",
      targets: ["claude-code"],
      status: "draft",
      lastVerified: "2026-04-15",
      maintainers: [],
      sources: [],
      disclaimer: true,
      variables: [],
      triggers: [],
      body: "",
      directory: "saudi/zatca-phase2",
      references: [],
      scripts: [],
      files: [],
      previousIds: [],
      lifecycle: "active",
      replacementId: null,
      sunsetDate: null,
      lifecycleNote: null,
    },
    {
      id: "architecture-testability-check",
      name: { en: "Testability", ar: "قابلية الاختبار" },
      slug: "testability-check",
      version: "0.1.0",
      category: "architecture",
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
      directory: "architecture/testability-check",
      references: [],
      scripts: [],
      files: [],
      previousIds: [],
      lifecycle: "active",
      replacementId: null,
      sunsetDate: null,
      lifecycleNote: null,
    },
  ];

  it("maps slugs to catalog entries and preserves order", () => {
    const result = recommendSkills(
      { market: "ksa", invoicing: true },
      fakeCatalog,
    );
    expect(result.map((s) => s.slug)).toEqual([
      "zatca-phase2",
      "testability-check",
    ]);
  });

  it("silently drops slugs that are not in the catalog", () => {
    const result = recommendSkills(
      { market: "ksa", invoicing: true, pii: true },
      fakeCatalog,
    );
    expect(result.map((s) => s.slug)).toEqual([
      "zatca-phase2",
      "testability-check",
    ]);
  });
});
