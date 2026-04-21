/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { ContributorWizard, type ContributorWizardLabels } from "@/components/contributor-wizard";
import type { GeneratedSkill } from "@/lib/skills/generated";

// next/navigation hooks are irrelevant for render smoke tests.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

const labels: ContributorWizardLabels = {
  shell: {
    ariaLabel: "Contributor",
    eyebrowOf: "Step {step} of {total}",
    stepPosition: "Step {step} of {total}",
    next: "Next",
    previous: "Previous",
    startOver: "Start over",
    finish: "Finish",
  },
  stepActionLabel: "Action",
  stepMetadataLabel: "Metadata",
  stepContentLabel: "Content",
  stepGovernanceLabel: "Governance",
  stepHandoffLabel: "AI handoff",
  actionHeading: "What?",
  actionLede: "Choose.",
  metadataHeading: "Metadata",
  metadataLede: "Metadata",
  contentHeading: "Content",
  contentLede: "Content",
  governanceHeading: "Governance",
  governanceLede: "Governance",
  handoffHeading: "Handoff",
  handoffLede: "Handoff",
  actionAdd: "Add skill",
  actionAddTagline: "Create a new skill",
  actionUpdate: "Update skill",
  actionUpdateTagline: "Update",
  actionRetire: "Retire skill",
  actionRetireTagline: "Retire",
  actionDelete: "Delete skill",
  actionDeleteTagline: "Delete",
  fieldsGroup: "group",
  fieldsSlug: "slug",
  fieldsId: "id",
  fieldsPreviousId: "previous",
  fieldsNameEn: "name_en",
  fieldsNameAr: "name_ar",
  fieldsSummaryEn: "summary_en",
  fieldsSummaryAr: "summary_ar",
  fieldsCategory: "category",
  fieldsRegion: "region",
  fieldsTargets: "targets",
  fieldsStatus: "status",
  fieldsMaintainers: "maintainers",
  fieldsSources: "sources",
  fieldsDisclaimer: "disclaimer",
  fieldsVariables: "variables",
  fieldsTriggers: "triggers",
  fieldsSupportFiles: "files",
  fieldsIntent: "intent",
  fieldsEditSummary: "edit",
  fieldsLifecycle: "lifecycle",
  fieldsReplacementId: "replacement",
  fieldsSunsetDate: "sunset",
  fieldsLifecycleNoteEn: "note_en",
  fieldsLifecycleNoteAr: "note_ar",
  fieldsDeleteConfirmation: "confirm",
  fieldsDeleteRationale: "rationale",
  actionRequired: "req",
  skillRequired: "Please select which skill this applies to.",
  categoryCompliance: "compliance",
  categorySecurity: "security",
  categoryArchitecture: "architecture",
  statusReviewed: "reviewed",
  statusCommunity: "community",
  statusDraft: "draft",
  lifecycleActive: "active",
  lifecycleDeprecated: "deprecated",
  lifecycleArchived: "archived",
  governanceCurrentVersion: "Current",
  governanceEstimatedVersion: "Estimated",
  governanceEstimatedBump: "Bump",
  governanceBumpPatch: "Patch",
  governanceBumpMinor: "Minor",
  governanceBumpMajor: "Major",
  deleteWarningTitle: "Danger",
  deleteWarningBody: "Prefer retire",
  deleteAcknowledge: "I acknowledge",
  addNewTargetOption: "add target",
  addTargetClaude: "Claude Code",
  addTargetCursor: "Cursor",
  addTargetCodex: "Codex",
  addTargetGeneric: "AGENTS.md",
  addRow: "add",
  removeRow: "remove",
  noneNote: "—",
  contributorReturn: "back",
  skillSelectorLabel: "Which skill?",
  skillSelectorNone: "Select",
  validationBlockedHint: "Fill required",
  templatePickerHeading: "Start from a template",
  templatePickerLede: "Pre-fill",
  templateSaudiComplianceName: "Saudi compliance",
  templateSaudiComplianceTagline: "Saudi",
  templateComplianceGenericName: "Compliance",
  templateComplianceGenericTagline: "Compliance",
  templateSecurityName: "Security",
  templateSecurityTagline: "Security",
  templateArchitectureName: "Architecture",
  templateArchitectureTagline: "Architecture",
  templateCustomName: "Blank",
  templateCustomTagline: "Blank",
  hintGroup: "",
  hintSlug: "",
  hintId: "",
  hintPreviousId: "",
  hintNameEn: "",
  hintNameAr: "",
  hintSummaryEn: "",
  hintSummaryAr: "",
  hintCategory: "",
  hintRegion: "",
  hintTargets: "",
  hintStatus: "",
  hintMaintainers: "",
  hintSources: "",
  hintDisclaimer: "",
  hintIntent: "",
  hintEditSummary: "",
  validationSlug: "slug",
  validationDate: "date",
  validationUrl: "url",
  validationRequired: "required",
  insertOutline: "Use recommended outline",
  clearOutline: "Clear",
  essentialsHeading: "Essentials",
  essentialsLede: "",
  identityHeading: "Identifiers",
  identityLede: "",
  advancedHeading: "Advanced",
  advancedLede: "",
  attestationHeading: "Attestation",
  attestationLede: "",
  livePreviewHeading: "Live",
  livePreviewLede: "",
  readinessHeading: "Readiness",
  readinessComplete: "Ready",
  readinessIncomplete: "Not ready",
  readinessField: "{count} missing",
  contributeViaAi: {
    eyebrow: "Prompt",
    heading: "Prompt",
    lede: "Prompt",
    charsLabel: "chars",
    bumpLabel: "Bump",
    copyCta: "Copy",
    copyCopied: "Copied",
    copyFallback: "Fallback",
    previewHeading: "Preview",
    agentClaudeName: "Claude Code",
    agentClaudeTagline: "Claude",
    agentCursorName: "Cursor",
    agentCursorTagline: "Cursor",
    agentCodexName: "Codex",
    agentCodexTagline: "Codex",
    agentGenericName: "Generic",
    agentGenericTagline: "Generic",
    bumpPatch: "Patch",
    bumpMinor: "Minor",
    bumpMajor: "Major",
    fallbackNote: "note",
  },
};

const skills: GeneratedSkill[] = [];

describe("ContributorWizard", () => {
  it("renders the action step with all four modes as radio buttons", () => {
    render(
      <ContributorWizard
        locale="en"
        skills={skills}
        labels={labels}
        initialAction={undefined}
        initialSkillId={null}
      />,
    );
    const radiogroup = screen.getByRole("radiogroup");
    const buttons = within(radiogroup).getAllByRole("radio");
    expect(buttons).toHaveLength(4);
    const dataActions = buttons.map((b) => b.getAttribute("data-action")).sort();
    expect(dataActions).toEqual(["add", "delete", "retire", "update"]);
  });

  it("starts on the metadata step when an action is pre-selected via URL", () => {
    render(
      <ContributorWizard
        locale="en"
        skills={skills}
        labels={labels}
        initialAction="add"
        initialSkillId={null}
      />,
    );
    // The first-level heading on the metadata step matches the label
    expect(
      screen.getByRole("heading", { level: 1, name: /^Metadata$/ }),
    ).toBeInTheDocument();
  });

  it("blocks handoff when a non-add mode has no real skill selected", () => {
    const { container } = render(
      <ContributorWizard
        locale="en"
        skills={[]}
        labels={labels}
        initialAction="update"
        initialSkillId={null}
      />,
    );
    // The skill selector must flag the missing selection; without a catalog
    // entry, non-add flows cannot proceed to the handoff step.
    const selector = container.querySelector<HTMLSelectElement>(
      "[data-slot='wizard-skill-selector']",
    );
    expect(selector).not.toBeNull();
    expect(selector!.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(/Please select which skill/i)).toBeInTheDocument();
  });

  it("resets the draft when the user switches from add to delete via the action step", () => {
    const skill: GeneratedSkill = {
      id: "arch-real",
      name: { en: "Real", ar: "حقيقي" },
      slug: "real",
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
      directory: "architecture/real",
      files: [],
      references: [],
      scripts: [],
    };
    const { container } = render(
      <ContributorWizard
        locale="en"
        skills={[skill]}
        labels={labels}
        initialAction={undefined}
        initialSkillId={null}
      />,
    );
    // On the action step, pick Add first. Then click Delete. The draft
    // reset clears any typed-in id so the delete flow cannot silently
    // reference a made-up skill.
    const radios = within(screen.getByRole("radiogroup")).getAllByRole("radio");
    const add = radios.find((r) => r.getAttribute("data-action") === "add")!;
    fireEvent.click(add);
    const del = radios.find((r) => r.getAttribute("data-action") === "delete")!;
    fireEvent.click(del);
    // Click Next to advance to the metadata step and verify the selector
    // starts empty — no stale id leaked from the previous action.
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    const selector = container.querySelector<HTMLSelectElement>(
      "[data-slot='wizard-skill-selector']",
    );
    expect(selector).not.toBeNull();
    expect(selector!.value).toBe("");
  });

  it("add mode exposes a select variable with editable options", () => {
    const { container } = render(
      <ContributorWizard
        locale="en"
        skills={[]}
        labels={labels}
        initialAction="add"
        initialSkillId={null}
      />,
    );
    // Apply the Architecture template to pre-fill group/category/etc.
    const archTemplate = container.querySelector<HTMLButtonElement>(
      "[data-template='architecture']",
    );
    expect(archTemplate).not.toBeNull();
    fireEvent.click(archTemplate!);
    // Fill the English title so auto-derive produces slug + id.
    const nameEnInput = container.querySelector<HTMLInputElement>(
      "input[placeholder='ZATCA Phase 2']",
    )!;
    fireEvent.change(nameEnInput, { target: { value: "Sample Skill" } });
    const nameArInput = container.querySelector<HTMLInputElement>(
      "input[placeholder='زاتكا المرحلة الثانية']",
    )!;
    fireEvent.change(nameArInput, { target: { value: "نموذج" } });
    // Summary inputs are textareas; grab them by dir attribute.
    const summaryEn = Array.from(
      container.querySelectorAll<HTMLTextAreaElement>("textarea"),
    ).find((el) => el.getAttribute("dir") !== "rtl")!;
    fireEvent.change(summaryEn, { target: { value: "summary" } });
    // Click through to content step.
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    // Variables editor on content step — add a variable, flip to select.
    const addRow = screen
      .getAllByRole("button", { name: /add/i })
      .find((btn) => btn.textContent === "add");
    expect(addRow).toBeDefined();
    fireEvent.click(addRow!);
    const variablesEditor = container.querySelector(
      "[data-slot='variables-editor']",
    );
    expect(variablesEditor).not.toBeNull();
    const typeSelect = variablesEditor!.querySelector<HTMLSelectElement>(
      "select[aria-label='type']",
    )!;
    fireEvent.change(typeSelect, { target: { value: "select" } });
    const optionsInput = variablesEditor!.querySelector<HTMLInputElement>(
      "input[aria-label='options (comma-separated)']",
    );
    expect(optionsInput).not.toBeNull();
    fireEvent.change(optionsInput!, { target: { value: "nodejs, dotnet" } });
    expect(optionsInput!.value).toBe("nodejs, dotnet");
  });

  it("renders the delete warning when navigating to the content step with action=delete", () => {
    const skill: GeneratedSkill = {
      id: "arch-x",
      name: { en: "X", ar: "س" },
      slug: "x",
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
      directory: "architecture/x",
      files: [],
      references: [],
      scripts: [],
    };
    render(
      <ContributorWizard
        locale="en"
        skills={[skill]}
        labels={labels}
        initialAction="delete"
        initialSkillId="arch-x"
      />,
    );
    // Navigate from metadata to content to surface the danger notice.
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.queryByText("Danger")).not.toBeNull();
    expect(screen.queryByText(/Prefer retire/i)).not.toBeNull();
  });
});
