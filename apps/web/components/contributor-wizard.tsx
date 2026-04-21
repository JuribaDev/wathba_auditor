"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Archive, Pencil, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ContributeViaAi, type ContributeViaAiLabels } from "@/components/contribute-via-ai";
import { WizardShell, type WizardStep, type WizardShellLabels } from "@/components/wizard-shell";
import {
  CONTRIBUTOR_TEMPLATES,
  DEFAULT_CONTRIBUTOR_DRAFT,
  SKILL_MD_OUTLINE,
  applyTemplate,
  deriveSkillId,
  estimateBump,
  hydrateDraftFromSkill,
  previewSkillYaml,
  slugifyName,
  suggestNextVersion,
  validateIsoDate,
  validateSlug,
  validateUrl,
  type ContributeAction,
  type ContributorDraft,
  type ContributorTemplate,
  type ContributorVariable,
} from "@/lib/contribute/prompt";
import type { AppLocale } from "@/lib/i18n";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";
import { cn } from "@/lib/utils";

type WizardStepId = "action" | "metadata" | "content" | "governance" | "handoff";

export type ContributorWizardLabels = {
  shell: WizardShellLabels;
  stepActionLabel: string;
  stepMetadataLabel: string;
  stepContentLabel: string;
  stepGovernanceLabel: string;
  stepHandoffLabel: string;
  actionHeading: string;
  actionLede: string;
  metadataHeading: string;
  metadataLede: string;
  contentHeading: string;
  contentLede: string;
  governanceHeading: string;
  governanceLede: string;
  handoffHeading: string;
  handoffLede: string;
  actionAdd: string;
  actionAddTagline: string;
  actionUpdate: string;
  actionUpdateTagline: string;
  actionRetire: string;
  actionRetireTagline: string;
  actionDelete: string;
  actionDeleteTagline: string;
  fieldsGroup: string;
  fieldsSlug: string;
  fieldsId: string;
  fieldsPreviousId: string;
  fieldsNameEn: string;
  fieldsNameAr: string;
  fieldsSummaryEn: string;
  fieldsSummaryAr: string;
  fieldsCategory: string;
  fieldsRegion: string;
  fieldsTargets: string;
  fieldsStatus: string;
  fieldsMaintainers: string;
  fieldsSources: string;
  fieldsDisclaimer: string;
  fieldsVariables: string;
  fieldsTriggers: string;
  fieldsSupportFiles: string;
  fieldsIntent: string;
  fieldsEditSummary: string;
  fieldsLifecycle: string;
  fieldsReplacementId: string;
  fieldsSunsetDate: string;
  fieldsLifecycleNoteEn: string;
  fieldsLifecycleNoteAr: string;
  fieldsDeleteConfirmation: string;
  fieldsDeleteRationale: string;
  actionRequired: string;
  skillRequired: string;
  categoryCompliance: string;
  categorySecurity: string;
  categoryArchitecture: string;
  statusReviewed: string;
  statusCommunity: string;
  statusDraft: string;
  lifecycleActive: string;
  lifecycleDeprecated: string;
  lifecycleArchived: string;
  governanceCurrentVersion: string;
  governanceEstimatedVersion: string;
  governanceEstimatedBump: string;
  governanceBumpPatch: string;
  governanceBumpMinor: string;
  governanceBumpMajor: string;
  deleteWarningTitle: string;
  deleteWarningBody: string;
  deleteAcknowledge: string;
  addNewTargetOption: string;
  addTargetClaude: string;
  addTargetCursor: string;
  addTargetCodex: string;
  addTargetGeneric: string;
  addRow: string;
  removeRow: string;
  contributeViaAi: ContributeViaAiLabels;
  noneNote: string;
  contributorReturn: string;
  skillSelectorLabel: string;
  skillSelectorNone: string;
  validationBlockedHint: string;
  templatePickerHeading: string;
  templatePickerLede: string;
  templateSaudiComplianceName: string;
  templateSaudiComplianceTagline: string;
  templateComplianceGenericName: string;
  templateComplianceGenericTagline: string;
  templateSecurityName: string;
  templateSecurityTagline: string;
  templateArchitectureName: string;
  templateArchitectureTagline: string;
  templateCustomName: string;
  templateCustomTagline: string;
  hintGroup: string;
  hintSlug: string;
  hintId: string;
  hintPreviousId: string;
  hintNameEn: string;
  hintNameAr: string;
  hintSummaryEn: string;
  hintSummaryAr: string;
  hintCategory: string;
  hintRegion: string;
  hintTargets: string;
  hintStatus: string;
  hintMaintainers: string;
  hintSources: string;
  hintDisclaimer: string;
  hintIntent: string;
  hintEditSummary: string;
  validationSlug: string;
  validationDate: string;
  validationUrl: string;
  validationRequired: string;
  insertOutline: string;
  clearOutline: string;
  essentialsHeading: string;
  essentialsLede: string;
  identityHeading: string;
  identityLede: string;
  advancedHeading: string;
  advancedLede: string;
  attestationHeading: string;
  attestationLede: string;
  livePreviewHeading: string;
  livePreviewLede: string;
  readinessHeading: string;
  readinessComplete: string;
  readinessIncomplete: string;
  readinessField: string;
};

type ContributorWizardProps = {
  locale: AppLocale;
  skills: GeneratedSkill[];
  labels: ContributorWizardLabels;
  // Tests can still inject initial state directly; production pages let the
  // wizard read `action=` / `id=` from `useSearchParams` so the hosting page
  // remains statically renderable under `output: "export"`.
  initialAction?: ContributeAction;
  initialSkillId?: string | null;
};

const VALID_ACTIONS: ContributeAction[] = ["add", "update", "retire", "delete"];

function parseContributeAction(value: string | null | undefined): ContributeAction | undefined {
  if (!value) return undefined;
  return (VALID_ACTIONS as readonly string[]).includes(value)
    ? (value as ContributeAction)
    : undefined;
}

const ACTION_ICON: Record<ContributeAction, React.ComponentType<{ className?: string }>> = {
  add: PlusCircle,
  update: Pencil,
  retire: Archive,
  delete: Trash2,
};

const ALL_TARGETS: TargetAgent[] = ["claude-code", "cursor", "codex", "agents-md"];

export function ContributorWizard({
  locale,
  skills,
  labels,
  initialAction: propInitialAction,
  initialSkillId: propInitialSkillId,
}: ContributorWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Prefer tests-provided props, but fall back to URL query so the hosting
  // page can stay a plain static server component.
  const queryAction = parseContributeAction(searchParams?.get("action"));
  const queryId = searchParams?.get("id") ?? null;
  const initialAction = propInitialAction ?? queryAction;
  const initialSkillId = propInitialSkillId ?? queryId;

  const [activeStep, setActiveStep] = React.useState<WizardStepId>(
    initialAction ? "metadata" : "action",
  );

  // `selectedSkillId` is the immutable catalog key that pairs a non-add draft
  // with a real skill. The editable `draft.id` field is only authoritative in
  // `add` mode; for update/retire/delete, governance and UI both look up the
  // baseline by `selectedSkillId` so a mid-edit rename does not disconnect the
  // draft from its predecessor (and therefore does not silently downgrade a
  // major rename to a patch).
  const initialSelectedId = React.useMemo(() => {
    if (!initialAction || initialAction === "add") return null;
    if (!initialSkillId) return null;
    return skills.some((s) => s.id === initialSkillId) ? initialSkillId : null;
  }, [initialAction, initialSkillId, skills]);

  const [selectedSkillId, setSelectedSkillId] = React.useState<string | null>(
    initialSelectedId,
  );

  const hydrateInitialDraft = React.useCallback((): ContributorDraft => {
    const action = initialAction ?? "add";
    if (action !== "add" && initialSelectedId) {
      const skill = skills.find((s) => s.id === initialSelectedId);
      if (skill) {
        const hydrated = hydrateDraftFromSkill(skill, action);
        return {
          ...hydrated,
          locale,
          lifecycle: action === "retire" ? "deprecated" : hydrated.lifecycle,
        };
      }
    }
    return { ...DEFAULT_CONTRIBUTOR_DRAFT, action, locale };
  }, [initialAction, initialSelectedId, locale, skills]);

  const [draft, setDraft] = React.useState<ContributorDraft>(() => hydrateInitialDraft());

  // Persist the in-progress draft to localStorage per locale so a contributor
  // who refreshes mid-flow does not lose typed-out content. Keyed on action
  // only (not skill id) — reloading the same action rehydrates. Add mode
  // is the common refresh-losing case; others already preload from the
  // catalog. Skipped on SSR.
  const persistenceKey = `wathba:contributor-draft:${locale}:${draft.action}`;
  const hasRestoredRef = React.useRef(false);
  React.useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    if (draft.action !== "add") return; // only add restores from storage
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(persistenceKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        setDraft((current) => ({ ...current, ...parsed, action: current.action, locale }));
      }
    } catch {
      /* ignore malformed cache */
    }
    // persistenceKey changes when action changes; restore should run once
    // per mount for the initial action only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (draft.action !== "add") return;
    try {
      window.localStorage.setItem(persistenceKey, JSON.stringify(draft));
    } catch {
      /* quota / private mode — skip silently */
    }
  }, [draft, persistenceKey]);

  // Track which fields the contributor has explicitly touched so auto-derive
  // does not overwrite values the user wants to keep. Auto-derivation only
  // fills slug and id while they remain untouched.
  const [touchedFields, setTouchedFields] = React.useState<Record<string, boolean>>(
    () => ({}),
  );
  const markTouched = React.useCallback((key: string) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const baseline = React.useMemo<GeneratedSkill | null>(() => {
    if (draft.action === "add") return null;
    if (!selectedSkillId) return null;
    return skills.find((s) => s.id === selectedSkillId) ?? null;
  }, [draft.action, selectedSkillId, skills]);

  const estimatedVersion = React.useMemo(
    () => suggestNextVersion(draft, baseline),
    [draft, baseline],
  );
  const bump = React.useMemo(() => estimateBump(draft, baseline), [draft, baseline]);

  const resolvedDraft: ContributorDraft = React.useMemo(() => {
    const resolved: ContributorDraft = {
      ...draft,
      version: draft.action === "add" ? draft.version || "0.1.0" : estimatedVersion,
    };
    // If the user is renaming an existing skill (id changed while still in
    // update/retire mode), auto-declare the identity migration so the
    // handoff prompt contains the `previous_id` list governance needs to
    // pair old-and-new in verify:skills:versions.
    if (
      baseline &&
      draft.action !== "add" &&
      draft.action !== "delete" &&
      draft.id &&
      draft.id !== baseline.id &&
      !resolved.previousId
    ) {
      resolved.previousId = baseline.id;
    }
    return resolved;
  }, [draft, estimatedVersion, baseline]);

  const updateDraft = React.useCallback(
    <K extends keyof ContributorDraft>(key: K, value: ContributorDraft[K]) => {
      setDraft((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  // Auto-derive slug from the English name and id from <group>-<slug>, but
  // only while the contributor has not explicitly edited those fields.
  // Runs in add mode only — update/retire/delete must not silently rewrite
  // an existing skill's id.
  React.useEffect(() => {
    if (draft.action !== "add") return;
    setDraft((current) => {
      if (current.action !== "add") return current;
      let next = current;
      if (!touchedFields.slug) {
        const derivedSlug = slugifyName(current.nameEn);
        if (derivedSlug && derivedSlug !== current.slug) {
          next = { ...next, slug: derivedSlug };
        }
      }
      const baseSlug = touchedFields.slug ? current.slug : slugifyName(current.nameEn);
      if (!touchedFields.id && baseSlug) {
        const derivedId = deriveSkillId(current.group, baseSlug);
        if (derivedId && derivedId !== current.id) {
          next = { ...next, id: derivedId };
        }
      }
      return next;
    });
  }, [draft.action, draft.nameEn, draft.group, touchedFields.slug, touchedFields.id]);

  const applyContributorTemplate = React.useCallback(
    (template: ContributorTemplate | null) => {
      setDraft((current) => {
        if (!template) {
          return { ...DEFAULT_CONTRIBUTOR_DRAFT, action: current.action, locale };
        }
        return applyTemplate(template, {
          ...DEFAULT_CONTRIBUTOR_DRAFT,
          action: current.action,
          locale,
          // keep any text the user has already typed so the template picker
          // can be invoked mid-edit without losing the title.
          nameEn: current.nameEn,
          nameAr: current.nameAr,
          summaryEn: current.summaryEn,
          summaryAr: current.summaryAr,
          intent: current.intent,
        });
      });
      // Applying a template re-auto-derives slug/id from the new group.
      setTouchedFields({});
    },
    [locale],
  );

  const onSelectAction = (next: ContributeAction) => {
    // Mode switches reset the draft so a previous action's field values cannot
    // leak into the new mode. In particular, a user who started in `add`
    // cannot later flip to `delete` and ship the typed-out id/slug without
    // ever selecting a real catalog entry.
    setSelectedSkillId(null);
    setDraft({ ...DEFAULT_CONTRIBUTOR_DRAFT, action: next, locale });
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("action", next);
    params.delete("id");
    router.replace(`?${params.toString()}`);
  };

  const loadSkillIntoDraft = (skillId: string) => {
    if (!skillId) {
      setSelectedSkillId(null);
      setDraft({ ...DEFAULT_CONTRIBUTOR_DRAFT, action: draft.action, locale });
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete("id");
      router.replace(`?${params.toString()}`);
      return;
    }
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;
    const hydrated = hydrateDraftFromSkill(skill, draft.action);
    setSelectedSkillId(skill.id);
    setDraft({
      ...hydrated,
      locale,
      lifecycle: draft.action === "retire" ? "deprecated" : hydrated.lifecycle,
    });
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("id", skillId);
    router.replace(`?${params.toString()}`);
  };

  const resetDraft = () => {
    setSelectedSkillId(null);
    setDraft({ ...DEFAULT_CONTRIBUTOR_DRAFT, locale });
    setActiveStep("action");
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(persistenceKey);
      } catch {
        /* ignore */
      }
    }
  };

  const actionValid = true;
  const metadataValid = (() => {
    if (draft.action === "add") {
      return Boolean(draft.id && draft.slug && draft.nameEn && draft.nameAr && draft.category);
    }
    // Non-add modes require both a selected catalog entry AND non-empty
    // identifier fields. Even though retire/delete lock those fields in
    // the UI, we double-check here so any manipulation cannot route the
    // handoff prompt at an empty or stale path.
    return Boolean(
      selectedSkillId &&
        skills.some((s) => s.id === selectedSkillId) &&
        draft.id &&
        draft.slug &&
        draft.group,
    );
  })();
  const contentValid = (() => {
    if (draft.action === "add") return Boolean(draft.intent.trim());
    if (draft.action === "update") return Boolean(draft.editSummary.trim());
    if (draft.action === "retire")
      return Boolean(draft.lifecycleNoteEn.trim() || draft.lifecycleNoteAr.trim());
    if (draft.action === "delete")
      return draft.deleteConfirmation && Boolean(draft.deleteRationale.trim());
    return true;
  })();

  // Count the schema-required gaps so the wizard can nudge the contributor
  // before they reach the Governance step. Mirrors `metadataValid` +
  // `contentValid` but surfaces specifics (maintainers, sources) that the
  // step-level booleans don't see — the schema rejects empty arrays.
  const missingFieldCount = (() => {
    let missing = 0;
    if (draft.action === "add") {
      if (!draft.nameEn) missing += 1;
      if (!draft.nameAr) missing += 1;
      if (!draft.category) missing += 1;
      if (!draft.slug) missing += 1;
      if (!draft.id) missing += 1;
      if (!draft.intent.trim()) missing += 1;
      if (draft.maintainers.every((m) => !m.github.trim())) missing += 1;
      if (draft.sources.every((s) => !s.url.trim() || !s.title.trim())) missing += 1;
    } else if (draft.action === "update") {
      if (!selectedSkillId) missing += 1;
      if (!draft.editSummary.trim()) missing += 1;
    } else if (draft.action === "retire") {
      if (!selectedSkillId) missing += 1;
      if (!draft.lifecycleNoteEn.trim() && !draft.lifecycleNoteAr.trim()) missing += 1;
    } else if (draft.action === "delete") {
      if (!selectedSkillId) missing += 1;
      if (!draft.deleteRationale.trim()) missing += 1;
      if (!draft.deleteConfirmation) missing += 1;
    }
    return missing;
  })();

  const steps: WizardStep<WizardStepId>[] = [
    {
      id: "action",
      label: labels.stepActionLabel,
      heading: labels.actionHeading,
      lede: labels.actionLede,
      content: (
        <ActionStep
          labels={labels}
          value={draft.action}
          onChange={onSelectAction}
        />
      ),
      valid: actionValid,
    },
    {
      id: "metadata",
      label: labels.stepMetadataLabel,
      heading: labels.metadataHeading,
      lede: labels.metadataLede,
      content: (
        <MetadataStep
          labels={labels}
          draft={draft}
          setDraft={setDraft}
          updateDraft={updateDraft}
          skills={skills}
          selectedSkillId={selectedSkillId}
          onSelectSkill={loadSkillIntoDraft}
          onApplyTemplate={applyContributorTemplate}
          markTouched={markTouched}
        />
      ),
      valid: metadataValid,
      blockedHint: labels.validationBlockedHint,
    },
    {
      id: "content",
      label: labels.stepContentLabel,
      heading: labels.contentHeading,
      lede: labels.contentLede,
      content: (
        <ContentStep
          labels={labels}
          draft={draft}
          updateDraft={updateDraft}
        />
      ),
      valid: contentValid,
      blockedHint: labels.validationBlockedHint,
    },
    {
      id: "governance",
      label: labels.stepGovernanceLabel,
      heading: labels.governanceHeading,
      lede: labels.governanceLede,
      content: (
        <GovernanceStep
          labels={labels}
          draft={resolvedDraft}
          baseline={baseline}
          bump={bump}
          nextVersion={estimatedVersion}
        />
      ),
      valid: true,
    },
    {
      id: "handoff",
      label: labels.stepHandoffLabel,
      heading: labels.handoffHeading,
      lede: labels.handoffLede,
      content: (
        <ContributeViaAi
          draft={resolvedDraft}
          baseline={baseline}
          labels={labels.contributeViaAi}
        />
      ),
      valid: true,
    },
  ];

  return (
    <WizardShell
      locale={locale}
      steps={steps}
      labels={labels.shell}
      activeStep={activeStep}
      onStepChange={(next) => setActiveStep(next as WizardStepId)}
      onReset={resetDraft}
      trailingSlot={
        activeStep !== "action" ? (
          <ReadinessSummary
            labels={labels}
            missingFieldCount={missingFieldCount}
          />
        ) : null
      }
    />
  );
}

function ReadinessSummary({
  labels,
  missingFieldCount,
}: {
  labels: ContributorWizardLabels;
  missingFieldCount: number;
}) {
  const complete = missingFieldCount === 0;
  const fieldSuffix = labels.readinessField.replace(
    "{count}",
    String(missingFieldCount),
  );
  return (
    <aside
      data-slot="readiness-summary"
      data-complete={complete}
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm",
        complete
          ? "border-success/40 bg-success/5 text-success"
          : "border-border bg-surface-variant/50 text-muted-foreground",
      )}
    >
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-[0.7rem] font-medium uppercase tracking-[0.18em] rtl:tracking-normal",
            complete ? "text-success" : "text-muted-foreground",
          )}
        >
          {labels.readinessHeading}
        </span>
        <span className={cn(complete ? "" : "text-foreground")}>
          {complete ? labels.readinessComplete : labels.readinessIncomplete}
        </span>
      </div>
      {!complete ? (
        <span className="font-mono text-xs text-muted-foreground">
          {fieldSuffix}
        </span>
      ) : null}
    </aside>
  );
}

function ActionStep({
  labels,
  value,
  onChange,
}: {
  labels: ContributorWizardLabels;
  value: ContributeAction;
  onChange: (action: ContributeAction) => void;
}) {
  const options: Array<{
    id: ContributeAction;
    name: string;
    tagline: string;
    emphasis?: "danger";
  }> = [
    { id: "add", name: labels.actionAdd, tagline: labels.actionAddTagline },
    { id: "update", name: labels.actionUpdate, tagline: labels.actionUpdateTagline },
    { id: "retire", name: labels.actionRetire, tagline: labels.actionRetireTagline },
    { id: "delete", name: labels.actionDelete, tagline: labels.actionDeleteTagline, emphasis: "danger" },
  ];
  return (
    <div role="radiogroup" aria-label={labels.actionHeading} className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const Icon = ACTION_ICON[option.id];
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-action={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "group flex items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-start transition-all",
              "hover:border-primary/60 hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              selected && "border-primary bg-primary/[0.04]",
              option.emphasis === "danger" && selected && "border-destructive bg-destructive/5",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-full border",
                option.emphasis === "danger"
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-primary-soft bg-primary-soft/30 text-primary",
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="grid gap-1">
              <span className="font-heading text-base text-foreground">{option.name}</span>
              <span className="text-sm leading-6 text-muted-foreground">{option.tagline}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MetadataStep({
  labels,
  draft,
  setDraft,
  updateDraft,
  skills,
  selectedSkillId,
  onSelectSkill,
  onApplyTemplate,
  markTouched,
}: {
  labels: ContributorWizardLabels;
  draft: ContributorDraft;
  setDraft: React.Dispatch<React.SetStateAction<ContributorDraft>>;
  updateDraft: <K extends keyof ContributorDraft>(key: K, value: ContributorDraft[K]) => void;
  skills: GeneratedSkill[];
  selectedSkillId: string | null;
  onSelectSkill: (id: string) => void;
  onApplyTemplate?: (template: ContributorTemplate | null) => void;
  markTouched?: (key: string) => void;
}) {
  const requiresSkillSelector = draft.action !== "add";
  const hasSelection = Boolean(
    selectedSkillId && skills.some((s) => s.id === selectedSkillId),
  );
  const isRenaming =
    requiresSkillSelector &&
    hasSelection &&
    draft.id !== "" &&
    draft.id !== selectedSkillId;
  const identityLocked =
    draft.action === "retire" || draft.action === "delete";
  const isAdd = draft.action === "add";
  const slugError = isAdd && draft.slug ? validateSlug(draft.slug) : null;
  const idError = isAdd && draft.id ? validateSlug(draft.id) : null;
  const lastVerifiedError = validateIsoDate(draft.lastVerified);

  const handleGroupChange = (value: string) => {
    markTouched?.("group");
    updateDraft("group", value);
  };
  const handleSlugChange = (value: string) => {
    markTouched?.("slug");
    updateDraft("slug", value.toLowerCase());
  };
  const handleIdChange = (value: string) => {
    markTouched?.("id");
    updateDraft("id", value.toLowerCase());
  };

  return (
    <div className="grid gap-8">
      {requiresSkillSelector ? (
        <Field label={labels.skillSelectorLabel}>
          <select
            data-slot="wizard-skill-selector"
            value={selectedSkillId ?? ""}
            onChange={(event) => onSelectSkill(event.target.value)}
            className={fieldInputClass}
            aria-required="true"
            aria-invalid={hasSelection ? undefined : true}
          >
            <option value="">{labels.skillSelectorNone}</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name[draft.locale]} ({skill.id})
              </option>
            ))}
          </select>
          {!hasSelection ? (
            <span
              data-slot="wizard-skill-selector-hint"
              className="text-[11.5px] leading-5 text-destructive"
            >
              {labels.skillRequired}
            </span>
          ) : null}
          {isRenaming ? (
            <span
              data-slot="wizard-rename-hint"
              className="text-[11.5px] leading-5 text-warning"
            >
              {labels.governanceBumpMajor}: {selectedSkillId} → {draft.id}
            </span>
          ) : null}
        </Field>
      ) : null}

      {isAdd && onApplyTemplate ? (
        <TemplatePicker
          labels={labels}
          current={draft}
          onApply={onApplyTemplate}
        />
      ) : null}

      <MetaSection title={labels.essentialsHeading} lede={labels.essentialsLede}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={labels.fieldsNameEn} hint={labels.hintNameEn}>
            <input
              type="text"
              value={draft.nameEn}
              onChange={(event) => updateDraft("nameEn", event.target.value)}
              className={fieldInputClass}
              placeholder="ZATCA Phase 2"
            />
          </Field>
          <Field label={labels.fieldsNameAr} hint={labels.hintNameAr} dir="rtl">
            <input
              type="text"
              value={draft.nameAr}
              onChange={(event) => updateDraft("nameAr", event.target.value)}
              className={fieldInputClass}
              dir="rtl"
              placeholder="زاتكا المرحلة الثانية"
            />
          </Field>
          <Field label={labels.fieldsSummaryEn} hint={labels.hintSummaryEn}>
            <textarea
              rows={3}
              value={draft.summaryEn}
              onChange={(event) => updateDraft("summaryEn", event.target.value)}
              className={fieldInputClass}
            />
          </Field>
          <Field label={labels.fieldsSummaryAr} hint={labels.hintSummaryAr} dir="rtl">
            <textarea
              rows={3}
              value={draft.summaryAr}
              onChange={(event) => updateDraft("summaryAr", event.target.value)}
              className={fieldInputClass}
              dir="rtl"
            />
          </Field>
          <Field label={labels.fieldsCategory} hint={labels.hintCategory}>
            <select
              value={draft.category}
              onChange={(event) => {
                const next = event.target.value as ContributorDraft["category"];
                setDraft((current) => ({
                  ...current,
                  category: next,
                  // Auto-flip disclaimer on compliance; never auto-off so the
                  // contributor sees their last explicit choice.
                  disclaimer: next === "compliance" ? true : current.disclaimer,
                }));
              }}
              className={fieldInputClass}
            >
              <option value="">—</option>
              <option value="compliance">{labels.categoryCompliance}</option>
              <option value="security">{labels.categorySecurity}</option>
              <option value="architecture">{labels.categoryArchitecture}</option>
            </select>
          </Field>
        </div>
      </MetaSection>

      <MetaSection title={labels.identityHeading} lede={labels.identityLede}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={labels.fieldsGroup} hint={labels.hintGroup}>
            <input
              type="text"
              value={draft.group}
              onChange={(event) => handleGroupChange(event.target.value)}
              placeholder="architecture"
              className={fieldInputClass}
              readOnly={identityLocked}
              aria-readonly={identityLocked}
            />
          </Field>
          <Field
            label={labels.fieldsSlug}
            hint={labels.hintSlug}
            error={slugError ? labels.validationSlug : null}
          >
            <input
              type="text"
              value={draft.slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              placeholder="my-skill"
              className={cn(
                fieldInputClass,
                slugError && "border-destructive focus-visible:ring-destructive",
              )}
              readOnly={identityLocked}
              aria-invalid={slugError ? true : undefined}
              aria-readonly={identityLocked}
            />
          </Field>
          <Field
            label={labels.fieldsId}
            hint={labels.hintId}
            error={idError ? labels.validationSlug : null}
          >
            <input
              type="text"
              value={draft.id}
              onChange={(event) => handleIdChange(event.target.value)}
              placeholder="group-slug"
              className={cn(
                fieldInputClass,
                idError && "border-destructive focus-visible:ring-destructive",
              )}
              readOnly={identityLocked}
              aria-invalid={idError ? true : undefined}
              aria-readonly={identityLocked}
            />
          </Field>
          <Field label={labels.fieldsPreviousId} hint={labels.hintPreviousId}>
            <input
              type="text"
              value={draft.previousId ?? ""}
              onChange={(event) => updateDraft("previousId", event.target.value || null)}
              className={fieldInputClass}
            />
          </Field>
        </div>
      </MetaSection>

      <MetaSection
        title={labels.advancedHeading}
        lede={labels.advancedLede}
        collapsible
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={labels.fieldsRegion} hint={labels.hintRegion}>
            <input
              type="text"
              value={draft.region ?? ""}
              onChange={(event) => updateDraft("region", event.target.value || null)}
              placeholder="saudi-arabia"
              className={fieldInputClass}
            />
          </Field>
          <Field label={labels.fieldsStatus} hint={labels.hintStatus}>
            <select
              value={draft.status}
              onChange={(event) =>
                updateDraft("status", event.target.value as ContributorDraft["status"])
              }
              className={fieldInputClass}
            >
              <option value="maintainer-reviewed">{labels.statusReviewed}</option>
              <option value="community-maintained">{labels.statusCommunity}</option>
              <option value="draft">{labels.statusDraft}</option>
            </select>
          </Field>
          <Field
            label="last_verified"
            hint={labels.hintSources}
            error={lastVerifiedError ? labels.validationDate : null}
          >
            <input
              type="date"
              value={draft.lastVerified}
              onChange={(event) => updateDraft("lastVerified", event.target.value)}
              className={cn(
                fieldInputClass,
                lastVerifiedError && "border-destructive focus-visible:ring-destructive",
              )}
              aria-invalid={lastVerifiedError ? true : undefined}
            />
          </Field>
          <Field label={labels.fieldsDisclaimer} hint={labels.hintDisclaimer}>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.disclaimer}
                onChange={(event) => updateDraft("disclaimer", event.target.checked)}
                className="size-4 rounded border border-border"
              />
              <span>{labels.fieldsDisclaimer}</span>
            </label>
          </Field>
        </div>

        <Field label={labels.fieldsTargets} hint={labels.hintTargets}>
          <div className="flex flex-wrap gap-2">
            {ALL_TARGETS.map((target) => {
              const active = draft.targets.includes(target);
              return (
                <button
                  key={target}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setDraft((current) => ({
                      ...current,
                      targets: active
                        ? current.targets.filter((t) => t !== target)
                        : [...current.targets, target],
                    }));
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/60",
                  )}
                >
                  {targetLabelFor(target, labels)}
                </button>
              );
            })}
          </div>
        </Field>
      </MetaSection>

      <MetaSection title={labels.attestationHeading} lede={labels.attestationLede}>
        <RepeatedField
          label={labels.fieldsMaintainers}
          rows={draft.maintainers}
          columns={["github"]}
          columnHeaders={["@github"]}
          onChange={(rows) => updateDraft("maintainers", rows as ContributorDraft["maintainers"])}
          addLabel={labels.addRow}
          removeLabel={labels.removeRow}
          makeEmpty={() => ({ github: "" })}
        />
        <SourcesEditor
          labels={labels}
          sources={draft.sources}
          onChange={(rows) => updateDraft("sources", rows)}
        />
      </MetaSection>
    </div>
  );
}

function TemplatePicker({
  labels,
  current,
  onApply,
}: {
  labels: ContributorWizardLabels;
  current: ContributorDraft;
  onApply: (template: ContributorTemplate | null) => void;
}) {
  const options: Array<{
    id: "custom" | ContributorTemplate["id"];
    name: string;
    tagline: string;
    template: ContributorTemplate | null;
  }> = [
    {
      id: "saudi-compliance",
      name: labels.templateSaudiComplianceName,
      tagline: labels.templateSaudiComplianceTagline,
      template: CONTRIBUTOR_TEMPLATES.find((t) => t.id === "saudi-compliance")!,
    },
    {
      id: "compliance-generic",
      name: labels.templateComplianceGenericName,
      tagline: labels.templateComplianceGenericTagline,
      template: CONTRIBUTOR_TEMPLATES.find((t) => t.id === "compliance-generic")!,
    },
    {
      id: "security",
      name: labels.templateSecurityName,
      tagline: labels.templateSecurityTagline,
      template: CONTRIBUTOR_TEMPLATES.find((t) => t.id === "security")!,
    },
    {
      id: "architecture",
      name: labels.templateArchitectureName,
      tagline: labels.templateArchitectureTagline,
      template: CONTRIBUTOR_TEMPLATES.find((t) => t.id === "architecture")!,
    },
    {
      id: "custom",
      name: labels.templateCustomName,
      tagline: labels.templateCustomTagline,
      template: null,
    },
  ];
  const activeId = (() => {
    if (!current.category) return "custom";
    const match = CONTRIBUTOR_TEMPLATES.find(
      (t) =>
        t.category === current.category &&
        t.group === current.group &&
        (t.region ?? null) === (current.region ?? null),
    );
    return match ? match.id : "custom";
  })();
  return (
    <div
      data-slot="contributor-template-picker"
      className="grid gap-3 rounded-2xl border border-dashed border-border bg-surface-variant/30 p-4 sm:p-5"
    >
      <div className="grid gap-1">
        <h3 className="font-heading text-base text-foreground">
          {labels.templatePickerHeading}
        </h3>
        <p className="text-[12.5px] leading-5 text-muted-foreground">
          {labels.templatePickerLede}
        </p>
      </div>
      <div role="radiogroup" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const selected = option.id === activeId;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-template={option.id}
              onClick={() => onApply(option.template)}
              className={cn(
                "grid gap-1 rounded-lg border px-3 py-3 text-start transition-all",
                "hover:border-primary/60 hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selected
                  ? "border-primary bg-primary/[0.04] shadow-sm"
                  : "border-border bg-surface",
              )}
            >
              <span className="font-heading text-[13px] text-foreground">
                {option.name}
              </span>
              <span className="text-[11.5px] leading-5 text-muted-foreground">
                {option.tagline}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetaSection({
  title,
  lede,
  collapsible = false,
  children,
}: {
  title: string;
  lede?: string;
  collapsible?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(!collapsible);
  return (
    <section data-slot="metadata-section" className="grid gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="grid gap-0.5">
          <h3 className="font-heading text-[15px] uppercase tracking-[0.18em] text-foreground rtl:tracking-normal rtl:normal-case">
            {title}
          </h3>
          {lede ? (
            <p className="text-[11.5px] leading-5 text-muted-foreground">{lede}</p>
          ) : null}
        </div>
        {collapsible ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
          >
            {open ? "−" : "+"}
          </Button>
        ) : null}
      </header>
      {open ? <div className="grid gap-4">{children}</div> : null}
    </section>
  );
}

function SourcesEditor({
  labels,
  sources,
  onChange,
}: {
  labels: ContributorWizardLabels;
  sources: ContributorDraft["sources"];
  onChange: (rows: ContributorDraft["sources"]) => void;
}) {
  const updateAt = (
    index: number,
    patch: Partial<ContributorDraft["sources"][number]>,
  ) => {
    onChange(sources.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const removeAt = (index: number) => onChange(sources.filter((_, i) => i !== index));
  const add = () =>
    onChange([
      ...sources,
      {
        title: "",
        url: "",
        accessed: new Date().toISOString().slice(0, 10),
      },
    ]);
  return (
    <div className="grid gap-2" data-slot="sources-editor">
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground rtl:tracking-normal">
        {labels.fieldsSources}
      </span>
      <span className="text-[11.5px] leading-5 text-muted-foreground">
        {labels.hintSources}
      </span>
      <div className="grid gap-2">
        {sources.map((source, index) => {
          const urlError = source.url ? validateUrl(source.url) : null;
          const dateError = source.accessed
            ? validateIsoDate(source.accessed)
            : null;
          return (
            <div
              key={index}
              data-slot="sources-editor-row"
              className="grid gap-2 rounded-lg border border-border bg-surface-variant/40 p-3"
            >
              <div className="grid gap-2 md:grid-cols-[1.2fr,1.2fr,130px,auto]">
                <input
                  type="text"
                  aria-label="title"
                  placeholder="Source title"
                  value={source.title}
                  onChange={(event) => updateAt(index, { title: event.target.value })}
                  className={fieldInputClass}
                />
                <input
                  type="url"
                  aria-label="url"
                  placeholder="https://example.org/"
                  value={source.url}
                  onChange={(event) => updateAt(index, { url: event.target.value })}
                  className={cn(
                    fieldInputClass,
                    urlError && "border-destructive focus-visible:ring-destructive",
                  )}
                  aria-invalid={urlError ? true : undefined}
                />
                <input
                  type="date"
                  aria-label="accessed"
                  value={source.accessed}
                  onChange={(event) => updateAt(index, { accessed: event.target.value })}
                  className={cn(
                    fieldInputClass,
                    dateError && "border-destructive focus-visible:ring-destructive",
                  )}
                  aria-invalid={dateError ? true : undefined}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAt(index)}
                  aria-label={`${labels.removeRow} ${index + 1}`}
                >
                  {labels.removeRow}
                </Button>
              </div>
              {(urlError || dateError) ? (
                <div className="flex gap-3 text-[11.5px] leading-5 text-destructive">
                  {urlError ? <span>{labels.validationUrl}</span> : null}
                  {dateError ? <span>{labels.validationDate}</span> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <Button type="button" size="sm" variant="secondary" onClick={add} className="w-fit">
        {labels.addRow}
      </Button>
    </div>
  );
}

function ContentStep({
  labels,
  draft,
  updateDraft,
}: {
  labels: ContributorWizardLabels;
  draft: ContributorDraft;
  updateDraft: <K extends keyof ContributorDraft>(key: K, value: ContributorDraft[K]) => void;
}) {
  if (draft.action === "delete") {
    return (
      <div className="grid gap-5">
        <Notice variant="warning" title={labels.deleteWarningTitle}>
          <p>{labels.deleteWarningBody}</p>
        </Notice>
        <Field label={labels.fieldsDeleteRationale}>
          <textarea
            rows={5}
            value={draft.deleteRationale}
            onChange={(event) => updateDraft("deleteRationale", event.target.value)}
            className={fieldInputClass}
          />
        </Field>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.deleteConfirmation}
            onChange={(event) => updateDraft("deleteConfirmation", event.target.checked)}
            className="size-4 rounded border border-border"
          />
          <span>{labels.deleteAcknowledge}</span>
        </label>
      </div>
    );
  }

  if (draft.action === "retire") {
    return (
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={labels.fieldsLifecycle}>
            <select
              value={draft.lifecycle}
              onChange={(event) =>
                updateDraft("lifecycle", event.target.value as ContributorDraft["lifecycle"])
              }
              className={fieldInputClass}
            >
              <option value="active">{labels.lifecycleActive}</option>
              <option value="deprecated">{labels.lifecycleDeprecated}</option>
              <option value="archived">{labels.lifecycleArchived}</option>
            </select>
          </Field>
          <Field label={labels.fieldsReplacementId}>
            <input
              type="text"
              value={draft.replacementId ?? ""}
              onChange={(event) => updateDraft("replacementId", event.target.value || null)}
              className={fieldInputClass}
            />
          </Field>
          <Field label={labels.fieldsSunsetDate}>
            <input
              type="date"
              value={draft.sunsetDate ?? ""}
              onChange={(event) => updateDraft("sunsetDate", event.target.value || null)}
              className={fieldInputClass}
            />
          </Field>
        </div>
        <Field label={labels.fieldsLifecycleNoteEn}>
          <textarea
            rows={3}
            value={draft.lifecycleNoteEn}
            onChange={(event) => updateDraft("lifecycleNoteEn", event.target.value)}
            className={fieldInputClass}
          />
        </Field>
        <Field label={labels.fieldsLifecycleNoteAr} dir="rtl">
          <textarea
            rows={3}
            value={draft.lifecycleNoteAr}
            onChange={(event) => updateDraft("lifecycleNoteAr", event.target.value)}
            className={fieldInputClass}
            dir="rtl"
          />
        </Field>
      </div>
    );
  }

  if (draft.action === "update") {
    return (
      <div className="grid gap-5">
        <Field label={labels.fieldsEditSummary} hint={labels.hintEditSummary}>
          <textarea
            rows={6}
            value={draft.editSummary}
            onChange={(event) => updateDraft("editSummary", event.target.value)}
            placeholder="Describe what you want to change in the SKILL.md body or metadata."
            className={fieldInputClass}
          />
        </Field>
        <VariablesEditor
          label={labels.fieldsVariables}
          addLabel={labels.addRow}
          removeLabel={labels.removeRow}
          variables={draft.variables}
          onChange={(rows) => updateDraft("variables", rows)}
        />
      </div>
    );
  }

  // add
  return (
    <div className="grid gap-5">
      <Field label={labels.fieldsIntent} hint={labels.hintIntent}>
        <div className="grid gap-2">
          <textarea
            rows={10}
            value={draft.intent}
            onChange={(event) => updateDraft("intent", event.target.value)}
            placeholder="What should SKILL.md teach the agent? Which rules must it enforce? What behaviors are out of scope?"
            className={fieldInputClass}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={draft.intent.trim() ? "outline" : "secondary"}
              onClick={() => updateDraft("intent", SKILL_MD_OUTLINE)}
              data-slot="intent-insert-outline"
            >
              {labels.insertOutline}
            </Button>
            {draft.intent ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => updateDraft("intent", "")}
                data-slot="intent-clear"
              >
                {labels.clearOutline}
              </Button>
            ) : null}
          </div>
        </div>
      </Field>
      <VariablesEditor
        label={labels.fieldsVariables}
        addLabel={labels.addRow}
        removeLabel={labels.removeRow}
        variables={draft.variables}
        onChange={(rows) => updateDraft("variables", rows)}
      />
      <RepeatedField
        label={labels.fieldsTriggers}
        rows={draft.triggers}
        columns={["key", "value"]}
        columnHeaders={["key", "value"]}
        onChange={(rows) => updateDraft("triggers", rows as ContributorDraft["triggers"])}
        addLabel={labels.addRow}
        removeLabel={labels.removeRow}
        makeEmpty={() => ({ key: "", value: "" })}
      />
      <RepeatedField
        label={labels.fieldsSupportFiles}
        rows={draft.supportFiles}
        columns={["path", "description"]}
        columnHeaders={["path", "description"]}
        onChange={(rows) =>
          updateDraft("supportFiles", rows as ContributorDraft["supportFiles"])
        }
        addLabel={labels.addRow}
        removeLabel={labels.removeRow}
        makeEmpty={() => ({ path: "", description: "" })}
      />
    </div>
  );
}

function GovernanceStep({
  labels,
  draft,
  baseline,
  bump,
  nextVersion,
}: {
  labels: ContributorWizardLabels;
  draft: ContributorDraft;
  baseline: GeneratedSkill | null;
  bump: ReturnType<typeof estimateBump>;
  nextVersion: string;
}) {
  const bumpLabel =
    bump === "major"
      ? labels.governanceBumpMajor
      : bump === "minor"
        ? labels.governanceBumpMinor
        : labels.governanceBumpPatch;
  // The live YAML preview reflects the *resolved* draft (with baseline-
  // anchored identity when required), so the contributor can see exactly
  // what the AI handoff prompt will ask the agent to write. Delete mode
  // doesn't emit a skill.yaml — show a note instead.
  const yaml = draft.action === "delete" ? null : previewSkillYaml(draft);
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
        <Stat label={labels.governanceCurrentVersion} value={baseline ? `v${baseline.version}` : "—"} />
        <Stat label={labels.governanceEstimatedVersion} value={`v${nextVersion}`} />
        <Stat label={labels.governanceEstimatedBump} value={bumpLabel} tone={bump} />
      </div>
      {bump === "major" ? (
        <Notice variant="warning" title={labels.governanceBumpMajor}>
          <p>
            <AlertTriangle aria-hidden className="me-2 inline size-4" />
            This change introduces breaking behaviour. The prompt will add reviewer guardrails.
          </p>
        </Notice>
      ) : null}
      {yaml ? (
        <figure
          data-slot="live-yaml-preview"
          className="grid gap-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        >
          <figcaption className="flex items-baseline justify-between gap-2 border-b border-border bg-surface-variant/70 px-5 py-3">
            <div className="grid gap-0.5">
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground rtl:tracking-normal">
                {labels.livePreviewHeading}
              </span>
              <span className="text-[11.5px] leading-5 text-muted-foreground">
                {labels.livePreviewLede}
              </span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">skill.yaml</span>
          </figcaption>
          <pre
            dir="ltr"
            className="max-h-[420px] overflow-auto px-5 py-4 font-mono text-[12px] leading-6 whitespace-pre-wrap break-words text-foreground"
          >
            {yaml}
          </pre>
        </figure>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
  dir,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  dir?: "rtl" | "ltr";
  hint?: string;
  error?: string | null;
}) {
  return (
    <label className="grid gap-1.5 text-sm" dir={dir}>
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground rtl:tracking-normal">
        {label}
      </span>
      {children}
      {error ? (
        <span
          data-slot="field-error"
          className="text-[11.5px] leading-5 text-destructive"
        >
          {error}
        </span>
      ) : hint ? (
        <span
          data-slot="field-hint"
          className="text-[11.5px] leading-5 text-muted-foreground"
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function Stat({
  label,
  value,
  tone = "patch",
}: {
  label: string;
  value: string;
  tone?: "patch" | "minor" | "major";
}) {
  return (
    <div className="grid gap-1">
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground rtl:tracking-normal">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-xl",
          tone === "major" && "text-destructive",
          tone === "minor" && "text-info",
          tone === "patch" && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// Dedicated variables editor — the schema requires `options` for every
// `type: select` variable, which the generic RepeatedField cannot express.
// This component drops the options row for text/boolean and exposes a
// comma-separated options field when type is select.
function VariablesEditor({
  label,
  addLabel,
  removeLabel,
  variables,
  onChange,
}: {
  label: string;
  addLabel: string;
  removeLabel: string;
  variables: ContributorVariable[];
  onChange: (rows: ContributorVariable[]) => void;
}) {
  const updateAt = (index: number, patch: Partial<ContributorVariable>) => {
    onChange(variables.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const removeAt = (index: number) => onChange(variables.filter((_, i) => i !== index));
  const add = () =>
    onChange([
      ...variables,
      {
        name: "",
        labelEn: "",
        labelAr: "",
        type: "text",
        options: [],
      },
    ]);
  return (
    <div className="grid gap-2" data-slot="variables-editor">
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground rtl:tracking-normal">
        {label}
      </span>
      <div className="grid gap-3">
        {variables.map((variable, index) => (
          <div
            key={index}
            data-slot="variables-editor-row"
            className="grid gap-2 rounded-lg border border-border bg-surface-variant/40 p-3"
          >
            <div className="grid gap-2 md:grid-cols-[1fr,1fr,1fr,140px,auto]">
              <input
                type="text"
                aria-label="name"
                placeholder="name"
                value={variable.name}
                onChange={(event) => updateAt(index, { name: event.target.value })}
                className={fieldInputClass}
              />
              <input
                type="text"
                aria-label="label_en"
                placeholder="label_en"
                value={variable.labelEn}
                onChange={(event) => updateAt(index, { labelEn: event.target.value })}
                className={fieldInputClass}
              />
              <input
                type="text"
                aria-label="label_ar"
                placeholder="label_ar"
                value={variable.labelAr}
                dir="rtl"
                onChange={(event) => updateAt(index, { labelAr: event.target.value })}
                className={fieldInputClass}
              />
              <select
                aria-label="type"
                value={variable.type}
                onChange={(event) =>
                  updateAt(index, {
                    type: event.target.value as ContributorVariable["type"],
                    options:
                      event.target.value === "select" ? variable.options : [],
                  })
                }
                className={fieldInputClass}
              >
                <option value="text">text</option>
                <option value="select">select</option>
                <option value="boolean">boolean</option>
              </select>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeAt(index)}
                aria-label={`${removeLabel} ${index + 1}`}
              >
                {removeLabel}
              </Button>
            </div>
            {variable.type === "select" ? (
              <div
                data-slot="variables-editor-options"
                className="grid gap-1 md:grid-cols-[110px,1fr] md:items-center"
              >
                <span className="text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground rtl:tracking-normal">
                  options
                </span>
                <input
                  type="text"
                  aria-label="options (comma-separated)"
                  placeholder="nodejs, dotnet, python"
                  value={variable.options.join(", ")}
                  onChange={(event) =>
                    updateAt(index, {
                      options: event.target.value
                        .split(",")
                        .map((option) => option.trim())
                        .filter(Boolean),
                    })
                  }
                  className={fieldInputClass}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="secondary" onClick={add} className="w-fit">
        {addLabel}
      </Button>
    </div>
  );
}

function RepeatedField<T extends Record<string, unknown>>({
  label,
  rows,
  columns,
  columnHeaders,
  onChange,
  addLabel,
  removeLabel,
  makeEmpty,
}: {
  label: string;
  rows: T[];
  columns: Array<keyof T & string>;
  columnHeaders: string[];
  onChange: (rows: T[]) => void;
  addLabel: string;
  removeLabel: string;
  makeEmpty: () => T;
}) {
  const setAt = (index: number, patch: Partial<T>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };
  const removeAt = (index: number) => onChange(rows.filter((_, i) => i !== index));
  const add = () => onChange([...rows, makeEmpty()]);
  return (
    <div className="grid gap-2">
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground rtl:tracking-normal">
        {label}
      </span>
      <div className="grid gap-2">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-lg border border-border bg-surface-variant/40 p-3 md:grid-cols-[1fr,auto]"
          >
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
              {columns.map((column, columnIndex) => (
                <input
                  key={column}
                  type="text"
                  placeholder={columnHeaders[columnIndex]}
                  value={(() => {
                    const raw = row[column] as unknown;
                    if (raw === null || raw === undefined) return "";
                    return typeof raw === "string" ? raw : String(raw);
                  })()}
                  onChange={(event) =>
                    setAt(index, { [column]: event.target.value } as unknown as Partial<T>)
                  }
                  className={fieldInputClass}
                />
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeAt(index)}
              aria-label={`${removeLabel} ${index + 1}`}
            >
              {removeLabel}
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="secondary" onClick={add} className="w-fit">
        {addLabel}
      </Button>
    </div>
  );
}

const fieldInputClass = cn(
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  "font-mono text-[13px]",
);

function targetLabelFor(target: TargetAgent, labels: ContributorWizardLabels): string {
  switch (target) {
    case "claude-code":
      return labels.addTargetClaude;
    case "cursor":
      return labels.addTargetCursor;
    case "codex":
      return labels.addTargetCodex;
    case "agents-md":
      return labels.addTargetGeneric;
    default:
      return target;
  }
}
