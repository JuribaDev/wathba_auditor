/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { AddSkillCta } from "@/components/add-skill-cta";
import { SkillLibrary } from "@/components/skill-library";
import type { GeneratedSkill } from "@/lib/skills/generated";

function makeSkill(overrides: Partial<GeneratedSkill>): GeneratedSkill {
  return {
    id: overrides.id ?? "arch-sample",
    name: { en: overrides.id ?? "Sample", ar: "نموذج" },
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

const baseLabels = {
  categoryLegend: "Category",
  statusLegend: "Status",
  lifecycleLegend: "Lifecycle",
  empty: "Empty",
  category: {
    all: "All categories",
    saudi: "Saudi",
    security: "Security",
    architecture: "Architecture",
  },
  status: {
    all: "All statuses",
    reviewed: "Reviewed",
    community: "Community",
    draft: "Draft",
  },
  lifecycle: {
    default: "Default",
    active: "Active",
    deprecated: "Deprecated",
    archived: "Archived",
    all: "All",
  },
  cardMeta: {
    category: {
      categorySaudi: "Saudi",
      categoryCompliance: "Compliance",
      categorySecurity: "Security",
      categoryArchitecture: "Architecture",
    },
    status: {
      statusReviewed: "Reviewed",
      statusCommunity: "Community",
      statusDraft: "Draft",
    },
    disclaimer: "Disclaimer",
    disclaimerTitle: "Not legal advice",
    versionPrefix: "v",
    verifiedPrefix: "Verified",
    viewSkill: "View skill",
    lifecycleDeprecated: "Deprecated",
    lifecycleArchived: "Archived",
    lifecycleDeprecatedShort: "Deprecated — prefer replacement",
    lifecycleArchivedShort: "Archived — hidden by default",
  },
};

describe("SkillLibrary", () => {
  it("hides archived skills by default and reveals them via the archived filter", () => {
    const skills = [
      makeSkill({ id: "arch-active", lifecycle: "active" }),
      makeSkill({ id: "arch-archived", lifecycle: "archived" }),
    ];
    render(<SkillLibrary locale="en" skills={skills} labels={baseLabels} />);
    // Default view: archived is not visible
    expect(screen.queryByRole("link", { name: /arch-archived/i })).toBeNull();
  });
});

describe("AddSkillCta", () => {
  it("renders the label, eyebrow, and the helper as visible supporting text", () => {
    render(
      <AddSkillCta
        locale="en"
        eyebrow="Contribute"
        label="Draft skill brief"
        helper="Guided contributor flow. Describe the skill, its sources, and its intent, then Wathba generates a repo-aware prompt for Claude Code, Cursor, Codex, or another coding agent."
      />,
    );
    const link = screen.getByRole("link", {
      name: /Contribute.*Draft skill brief.*Guided contributor flow/i,
    });
    expect(link.getAttribute("href")).toBe("/en/skills/contribute?action=add");
    expect(link.getAttribute("data-slot")).toBe("skills-add-cta");
    // Helper must render as visible supporting text, not only as a title tooltip.
    const helper = link.querySelector(
      "[data-slot='skills-add-cta-helper']",
    );
    expect(helper).not.toBeNull();
    expect(helper?.textContent).toMatch(/Guided contributor flow/i);
    expect(helper?.textContent).toMatch(/Claude Code, Cursor, Codex/i);
  });
});
