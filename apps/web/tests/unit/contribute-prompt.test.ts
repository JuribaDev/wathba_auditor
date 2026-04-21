import { describe, expect, it } from "vitest";

import {
  buildAuthoringPrompt,
  DEFAULT_CONTRIBUTOR_DRAFT,
  estimateBump,
  hydrateDraftFromSkill,
  suggestNextVersion,
  type ContributorDraft,
} from "@/lib/contribute/prompt";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";

const baseSkill: GeneratedSkill = {
  id: "architecture-sample",
  name: { en: "Sample", ar: "نموذج" },
  summary: { en: "Sample summary", ar: "ملخّص العيّنة" },
  slug: "sample",
  previousIds: [],
  version: "0.2.0",
  category: "architecture",
  region: null,
  targets: ["claude-code", "cursor"],
  status: "community-maintained",
  lifecycle: "active",
  replacementId: null,
  sunsetDate: null,
  lifecycleNote: null,
  lastVerified: "2026-01-15",
  maintainers: [{ github: "@owner" }],
  sources: [
    { title: "Source", url: "https://example.test/", accessed: "2026-01-15" },
  ],
  disclaimer: false,
  variables: [],
  triggers: [],
  body: "# Sample body",
  directory: "architecture/sample",
  files: [],
  references: [],
  scripts: [],
};

function draft(overrides: Partial<ContributorDraft> = {}): ContributorDraft {
  return {
    ...DEFAULT_CONTRIBUTOR_DRAFT,
    ...overrides,
  };
}

describe("authoring prompt builder", () => {
  it("add prompt contains folder-creation instructions and skill yaml", () => {
    const bundle = buildAuthoringPrompt(
      draft({
        action: "add",
        group: "architecture",
        slug: "test-skill",
        id: "architecture-test-skill",
        nameEn: "Test",
        nameAr: "اختبار",
        summaryEn: "en",
        summaryAr: "ع",
        category: "architecture",
        intent: "What the skill teaches.",
        targetAgent: "claude-code",
      }),
      null,
    );
    expect(bundle.action).toBe("add");
    expect(bundle.agent).toBe("claude-code");
    expect(bundle.text).toMatch(/skills\/architecture\/test-skill\//);
    expect(bundle.text).toMatch(/id: architecture-test-skill/);
    expect(bundle.text).toMatch(/slug: test-skill/);
    expect(bundle.text).toMatch(/pnpm generate:skills/);
    expect(bundle.text).toMatch(/pnpm verify:skills/);
    expect(bundle.estimatedBump).toBe("minor");
  });

  it("update prompt preserves identity and targets the existing folder", () => {
    const bundle = buildAuthoringPrompt(
      hydrateDraftFromSkill(baseSkill, "update"),
      baseSkill,
    );
    expect(bundle.action).toBe("update");
    expect(bundle.text).toContain("skills/architecture/sample/");
    expect(bundle.text).toMatch(/Do not change `id` or `slug`/);
    expect(bundle.estimatedBump).toBe("patch");
  });

  it("update prompt escalates to minor when a target is added", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "update");
    const nextTargets: TargetAgent[] = [...hydrated.targets, "codex"];
    const bundle = buildAuthoringPrompt(
      { ...hydrated, targets: nextTargets },
      baseSkill,
    );
    expect(bundle.estimatedBump).toBe("minor");
  });

  it("update prompt escalates to major when a target is removed", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "update");
    const nextTargets: TargetAgent[] = ["claude-code"];
    const bundle = buildAuthoringPrompt(
      { ...hydrated, targets: nextTargets },
      baseSkill,
    );
    expect(bundle.estimatedBump).toBe("major");
  });

  it("retire prompt is minor and carries lifecycle metadata", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "retire");
    const bundle = buildAuthoringPrompt(
      {
        ...hydrated,
        lifecycle: "deprecated",
        replacementId: "architecture-other",
        sunsetDate: "2026-12-31",
        lifecycleNoteEn: "Use architecture-other.",
        lifecycleNoteAr: "استخدم architecture-other.",
      },
      baseSkill,
    );
    expect(bundle.action).toBe("retire");
    expect(bundle.estimatedBump).toBe("minor");
    expect(bundle.text).toContain("lifecycle: deprecated");
    expect(bundle.text).toContain("replacement_id: architecture-other");
    expect(bundle.text).toContain("Use architecture-other.");
  });

  it("delete prompt is major and demands rationale", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "delete");
    const bundle = buildAuthoringPrompt(
      {
        ...hydrated,
        deleteRationale: "Skill was never released.",
        deleteConfirmation: true,
      },
      baseSkill,
    );
    expect(bundle.action).toBe("delete");
    expect(bundle.estimatedBump).toBe("major");
    expect(bundle.text).toMatch(/advanced maintenance/i);
    expect(bundle.text).toContain("Skill was never released.");
    expect(bundle.text).toMatch(/replacement_id: architecture-sample/);
  });

  it("outputs a prompt for each agent with a stable agent id", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "update");
    const agents = ["claude-code", "cursor", "codex", "agents-md"] as const;
    for (const agent of agents) {
      const bundle = buildAuthoringPrompt({ ...hydrated, targetAgent: agent }, baseSkill);
      expect(bundle.agent).toBe(agent);
      expect(bundle.text.length).toBeGreaterThan(200);
    }
  });

  it("suggestNextVersion derives the next semver from the required bump", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "update");
    // Patch edit — only edit summary.
    const patchDraft = { ...hydrated, editSummary: "fix wording" };
    expect(suggestNextVersion(patchDraft, baseSkill)).toBe("0.2.1");
    // Minor edit — add target.
    const minorTargets: TargetAgent[] = [...hydrated.targets, "codex"];
    const minorDraft = { ...hydrated, targets: minorTargets };
    expect(suggestNextVersion(minorDraft, baseSkill)).toBe("0.3.0");
    // Major edit — remove target.
    const majorTargets: TargetAgent[] = ["claude-code"];
    const majorDraft = { ...hydrated, targets: majorTargets };
    expect(suggestNextVersion(majorDraft, baseSkill)).toBe("1.0.0");
  });

  it("estimateBump respects add/retire/delete shortcuts", () => {
    expect(estimateBump(draft({ action: "add" }), null)).toBe("minor");
    expect(estimateBump(draft({ action: "retire" }), baseSkill)).toBe("minor");
    expect(estimateBump(draft({ action: "delete" }), baseSkill)).toBe("major");
  });

  it("keeps the baseline intact during an id rename so the major bump is detected", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "update");
    // Simulate the user renaming the skill mid-update. With the fix, callers
    // pass the ORIGINAL baseline (not a live-lookup via the new id) so the
    // classifier still sees a changed id and escalates to major.
    const renamed = { ...hydrated, id: "architecture-sample-v2" };
    expect(estimateBump(renamed, baseSkill)).toBe("major");
    expect(suggestNextVersion(renamed, baseSkill)).toBe("1.0.0");
  });

  it("update prompt auto-declares previous_id when the draft id differs from the baseline id", () => {
    const bundle = buildAuthoringPrompt(
      {
        ...hydrateDraftFromSkill(baseSkill, "update"),
        id: "architecture-sample-v2",
        previousId: baseSkill.id,
      },
      baseSkill,
    );
    expect(bundle.text).toContain("previous_id:");
    expect(bundle.text).toContain(baseSkill.id);
    expect(bundle.estimatedBump).toBe("major");
  });

  it("preserves boolean trigger values through hydrate + re-emit", () => {
    const boolSkill: GeneratedSkill = {
      ...baseSkill,
      triggers: [{ when: { handles_invoicing: true, handles_pii: false, count: 3, flag: null } }],
    };
    const hydrated = hydrateDraftFromSkill(boolSkill, "update");
    const bundle = buildAuthoringPrompt(hydrated, boolSkill);
    // Boolean/number/null must emit as YAML literals, never as quoted strings.
    expect(bundle.text).toContain("handles_invoicing: true");
    expect(bundle.text).toContain("handles_pii: false");
    expect(bundle.text).toContain("count: 3");
    expect(bundle.text).toContain("flag: null");
    expect(bundle.text).not.toContain('handles_invoicing: "true"');
  });

  it("update prompt anchors the edit path on the baseline even if the draft group/slug are tampered", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "update");
    const tampered = {
      ...hydrated,
      group: "wrong",
      slug: "hijacked",
      editSummary: "tweak body",
    };
    const bundle = buildAuthoringPrompt(tampered, baseSkill);
    // Current path must come from the baseline, not the tampered draft.
    expect(bundle.text).toContain("skills/architecture/sample/");
    // The tampered path should still appear once, because this IS a rename
    // (group/slug diverged), so the prompt should instruct the agent to
    // move the folder after editing — but never as the starting "current"
    // target.
    expect(bundle.text).toMatch(
      /Target skill directory \(current\): `skills\/architecture\/sample\/`/,
    );
  });

  it("update prompt emits an explicit move step when the draft renames the skill", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "update");
    const renamed = {
      ...hydrated,
      slug: "sample-v2",
      id: "architecture-sample-v2",
      editSummary: "major rewrite",
    };
    const bundle = buildAuthoringPrompt(renamed, baseSkill);
    expect(bundle.text).toContain("skills/architecture/sample/");
    expect(bundle.text).toContain("skills/architecture/sample-v2/");
    expect(bundle.text).toMatch(/move the directory/i);
    expect(bundle.text).toContain("previous_id:");
    expect(bundle.estimatedBump).toBe("major");
  });

  it("retire and delete always target the baseline's directory even if identity fields are tampered", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "retire");
    const tampered = {
      ...hydrated,
      id: "",
      slug: "hacked",
      group: "totally-wrong",
      lifecycle: "deprecated" as const,
      lifecycleNoteEn: "note",
    };
    const bundle = buildAuthoringPrompt(tampered, baseSkill);
    // Prompt must reference the baseline's real directory, not the tampered values.
    expect(bundle.text).toContain("skills/architecture/sample/");
    expect(bundle.text).not.toContain("skills/totally-wrong/hacked/");
  });

  it("delete prompt targets the baseline directory regardless of draft values", () => {
    const hydrated = hydrateDraftFromSkill(baseSkill, "delete");
    const tampered = {
      ...hydrated,
      id: "hijacked",
      slug: "hijacked",
      group: "wrong",
      deleteConfirmation: true,
      deleteRationale: "ok",
    };
    const bundle = buildAuthoringPrompt(tampered, baseSkill);
    expect(bundle.text).toContain("skills/architecture/sample/");
    expect(bundle.text).not.toContain("skills/wrong/hijacked/");
  });

  it("quotes YAML scalars that contain a colon so the fenced block stays parseable", () => {
    const bundle = buildAuthoringPrompt(
      draft({
        action: "add",
        group: "architecture",
        slug: "payments-core",
        id: "architecture-payments-core",
        nameEn: "Payments: core",
        nameAr: "المدفوعات: الأساس",
        summaryEn: "Uses # markers and : separators",
        summaryAr: "ملخص",
        category: "architecture",
        intent: "body",
        targetAgent: "claude-code",
        lifecycleNoteEn: "See ref: https://example.test/",
        lifecycleNoteAr: "ملاحظة",
      }),
      null,
    );
    // The colon-bearing values must be quoted rather than raw-interpolated.
    expect(bundle.text).toContain('en: "Payments: core"');
    expect(bundle.text).toContain('en: "Uses # markers and : separators"');
  });

  it("escapes embedded quotes and newlines in lifecycle notes", () => {
    const bundle = buildAuthoringPrompt(
      draft({
        action: "retire",
        group: "architecture",
        slug: "sample",
        id: "architecture-sample",
        lifecycle: "deprecated",
        lifecycleNoteEn: 'The "next" skill covers this\nacross multiple lines.',
        lifecycleNoteAr: "ملاحظة",
      }),
      {
        ...baseSkill,
        id: "architecture-sample",
        slug: "sample",
      },
    );
    expect(bundle.text).toContain('\\"next\\"');
    expect(bundle.text).toContain("\\n");
  });

  it("localizes the prompt heading for Arabic", () => {
    const bundle = buildAuthoringPrompt(
      draft({
        action: "add",
        locale: "ar",
        group: "architecture",
        slug: "test-skill",
        id: "architecture-test-skill",
        nameEn: "Test",
        nameAr: "اختبار",
        category: "architecture",
        intent: "ماذا تعلّم.",
        targetAgent: "claude-code",
      }),
      null,
    );
    expect(bundle.text).toMatch(/إنشاء مهارة Wathba/);
  });
});
