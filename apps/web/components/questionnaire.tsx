"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";

import {
  QuestionnaireShell,
  type QuestionnaireLabels,
} from "@/components/questionnaire-shell";
import {
  StepAbout,
  type AboutStepLabels,
} from "@/components/questionnaire/step-about";
import {
  StepGenerate,
  type GenerateStepLabels,
  type PreviewContents,
} from "@/components/questionnaire/step-generate";
import {
  StepReview,
  type ReviewStepLabels,
} from "@/components/questionnaire/step-review";
import {
  addManualSelection,
  partitionLibraryForReview,
  seedAutoRecommendations,
  toggleSelection,
  type SelectionSource,
  type Selections,
} from "@/lib/questionnaire/selections";
import {
  StepTech,
  type TechStepLabels,
} from "@/components/questionnaire/step-tech";
import {
  StepVariables,
  type VariablesStepLabels,
} from "@/components/questionnaire/step-variables";
import { renderClaudeCodeFiles } from "@/lib/generate/adapters/claude-code";
import { renderCodexFiles } from "@/lib/generate/adapters/codex";
import { renderCursorFiles } from "@/lib/generate/adapters/cursor";
import { buildFilePlan, getActiveSkills } from "@/lib/generate/file-plan";
import { resolveSelectedSkills } from "@/lib/generate/resolve-markdown";
import type { AppLocale } from "@/lib/i18n";
import {
  clearQuestionnaireState,
  loadQuestionnaireRoute,
  loadQuestionnaireState,
  saveQuestionnaireRoute,
  saveQuestionnaireState,
} from "@/lib/persistence";
import type { QuestionnaireStepId } from "@/lib/questionnaire/steps";
import {
  hasAnyError,
  validateAboutStep,
  validateTechStep,
  type AboutStepErrors,
  type TechStepErrors,
  type ValidationMessages,
} from "@/lib/questionnaire/validation";
import {
  getActiveVariableSkills,
  type VariableValue,
  type VariableValues,
} from "@/lib/questionnaire/variables";
import { generatedSkills, generatedSkillsById } from "@/lib/skills/generated";
import {
  recommendSkills,
  type QuestionnaireAnswers,
} from "@/lib/skills/recommendations";

export type QuestionnaireProps = {
  locale: AppLocale;
  shellLabels: QuestionnaireLabels;
  aboutLabels: AboutStepLabels;
  techLabels: TechStepLabels;
  reviewLabels: ReviewStepLabels;
  variablesLabels: VariablesStepLabels;
  generateLabels: GenerateStepLabels;
  validationMessages: ValidationMessages;
};

export function Questionnaire({
  locale,
  shellLabels,
  aboutLabels,
  techLabels,
  reviewLabels,
  variablesLabels,
  generateLabels,
  validationMessages,
}: QuestionnaireProps) {
  const searchParams = useSearchParams();
  // `?skill=<id>` deep-links from the public skill detail page. The id is
  // captured once at mount — later search-param churn from other sources
  // should not re-preselect or clobber a user's manual removal.
  const preselectedSkillId = React.useMemo(() => {
    const raw = searchParams?.get("skill");
    if (!raw) return null;
    return generatedSkillsById[raw] ? raw : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [answers, setAnswers] = React.useState<QuestionnaireAnswers>({});
  const [attemptedSteps, setAttemptedSteps] = React.useState<
    ReadonlySet<QuestionnaireStepId>
  >(() => new Set());
  const [selections, setSelections] = React.useState<Selections>({});
  const [variableValues, setVariableValues] =
    React.useState<VariableValues>({});
  const [step, setStep] = React.useState<QuestionnaireStepId>("about");
  const seededRecommendationsRef = React.useRef<boolean>(false);
  const preselectAppliedRef = React.useRef<boolean>(false);
  const [hydrated, setHydrated] = React.useState<boolean>(false);

  React.useEffect(() => {
    const persistedState = loadQuestionnaireState();
    const persistedRoute = loadQuestionnaireRoute();
    let hydratedSelections: Selections = persistedState?.selections ?? {};
    if (persistedState) {
      // Hydration from localStorage after mount is the React-recommended
      // pattern for static export + SSR: defaults render on the server and
      // client-only state is applied in an effect to avoid hydration
      // mismatches. React will batch these setState calls.
      /* eslint-disable react-hooks/set-state-in-effect */
      setAnswers(persistedState.answers);
      setVariableValues(persistedState.variableValues);
      setAttemptedSteps(new Set(persistedState.attemptedSteps));
      seededRecommendationsRef.current = persistedState.seededRecommendations;
    }
    // Apply the `?skill=<id>` deep-link after localStorage state is known so
    // we add to persisted selections rather than overwriting them.
    if (preselectedSkillId && !preselectAppliedRef.current) {
      hydratedSelections = addManualSelection(
        hydratedSelections,
        preselectedSkillId,
      );
      preselectAppliedRef.current = true;
    }
    setSelections(hydratedSelections);
    if (persistedRoute) {
      setStep(persistedRoute);
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [preselectedSkillId]);

  React.useEffect(() => {
    if (!hydrated) return;
    saveQuestionnaireRoute(step);
  }, [hydrated, step]);

  React.useEffect(() => {
    if (!hydrated) return;
    saveQuestionnaireState({
      answers,
      selections,
      variableValues,
      attemptedSteps: [...attemptedSteps],
      seededRecommendations: seededRecommendationsRef.current,
    });
  }, [hydrated, answers, selections, variableValues, attemptedSteps]);

  const handleReset = React.useCallback(() => {
    clearQuestionnaireState();
    seededRecommendationsRef.current = false;
    setAnswers({});
    setSelections({});
    setVariableValues({});
    setAttemptedSteps(new Set());
    setStep("about");
  }, []);

  const handleAboutChange = React.useCallback(
    (patch: Partial<QuestionnaireAnswers>) => {
      setAnswers((prev) => {
        const next: QuestionnaireAnswers = { ...prev, ...patch };
        if (
          patch.market !== undefined &&
          patch.market !== "ksa" &&
          patch.market !== "gcc"
        ) {
          next.invoicing = undefined;
          next.payments = undefined;
          next.identity = undefined;
        }
        return next;
      });
    },
    [],
  );

  const handleTechChange = React.useCallback(
    (patch: Partial<QuestionnaireAnswers>) => {
      setAnswers((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const aboutErrors: AboutStepErrors = React.useMemo(
    () => validateAboutStep(answers, validationMessages),
    [answers, validationMessages],
  );
  const techErrors: TechStepErrors = React.useMemo(
    () => validateTechStep(answers, validationMessages),
    [answers, validationMessages],
  );

  const showAboutErrors = attemptedSteps.has("about");
  const showTechErrors = attemptedSteps.has("tech");

  const recommendations = React.useMemo(
    () => recommendSkills(answers),
    [answers],
  );

  const handleToggleSelection = React.useCallback(
    (skillId: string, source: SelectionSource) => {
      setSelections((prev) => toggleSelection(prev, skillId, source));
    },
    [],
  );

  const handleAddManualSkill = React.useCallback((skillId: string) => {
    setSelections((prev) => addManualSelection(prev, skillId));
  }, []);

  const { manualSkills, availableSkills } = React.useMemo(
    () =>
      partitionLibraryForReview(generatedSkills, recommendations, selections),
    [recommendations, selections],
  );

  const handleVariableChange = React.useCallback(
    (key: string, value: VariableValue) => {
      setVariableValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const activeVariableSkills = React.useMemo(
    () => getActiveVariableSkills(generatedSkills, selections),
    [selections],
  );

  const activeSkills = React.useMemo(
    () => getActiveSkills(generatedSkills, selections),
    [selections],
  );

  const filePlan = React.useMemo(
    () => buildFilePlan(answers.agents, activeSkills),
    [answers.agents, activeSkills],
  );

  const resolvedCatalog = React.useMemo(
    () => resolveSelectedSkills(activeSkills, variableValues, answers),
    [activeSkills, variableValues, answers],
  );

  const previewContents = React.useMemo<PreviewContents>(() => {
    const contents: PreviewContents = {};
    const claudeFiles = renderClaudeCodeFiles(
      activeSkills,
      resolvedCatalog.resolutions,
    );
    if (claudeFiles.length > 0) {
      contents["claude-code"] = new Map(
        claudeFiles.map((file) => [file.path, file.content]),
      );
    }
    const cursorFiles = renderCursorFiles(
      activeSkills,
      resolvedCatalog.resolutions,
    );
    if (cursorFiles.length > 0) {
      contents["cursor"] = new Map(
        cursorFiles.map((file) => [file.path, file.content]),
      );
    }
    const codexFiles = renderCodexFiles(
      activeSkills,
      resolvedCatalog.resolutions,
    );
    if (codexFiles.length > 0) {
      contents["codex"] = new Map(
        codexFiles.map((file) => [file.path, file.content]),
      );
    }
    return contents;
  }, [activeSkills, resolvedCatalog.resolutions]);

  const handleBeforeNext = React.useCallback(
    (step: QuestionnaireStepId): boolean => {
      if (step === "about" || step === "tech") {
        const stepErrors = step === "about" ? aboutErrors : techErrors;
        if (hasAnyError(stepErrors)) {
          setAttemptedSteps((prev) => {
            if (prev.has(step)) return prev;
            const next = new Set(prev);
            next.add(step);
            return next;
          });
          return false;
        }
        if (step === "tech" && !seededRecommendationsRef.current) {
          seededRecommendationsRef.current = true;
          setSelections((prev) => seedAutoRecommendations(prev, recommendations));
        }
      }
      return true;
    },
    [aboutErrors, techErrors, recommendations],
  );

  return (
    <QuestionnaireShell
      locale={locale}
      labels={shellLabels}
      step={step}
      onStepChange={setStep}
      onBeforeNext={handleBeforeNext}
      onReset={handleReset}
      aboutSlot={
        <StepAbout
          answers={answers}
          onChange={handleAboutChange}
          labels={aboutLabels}
          errors={showAboutErrors ? aboutErrors : undefined}
        />
      }
      techSlot={
        <StepTech
          answers={answers}
          onChange={handleTechChange}
          labels={techLabels}
          errors={showTechErrors ? techErrors : undefined}
        />
      }
      reviewSlot={
        <>
          {preselectedSkillId &&
          selections[preselectedSkillId] &&
          generatedSkillsById[preselectedSkillId] ? (
            <SelectedFromLibraryNotice
              skillName={
                generatedSkillsById[preselectedSkillId].name[locale] ??
                generatedSkillsById[preselectedSkillId].name.en
              }
              labels={{
                label: reviewLabels.selectedFromLibraryLabel,
                lede: reviewLabels.selectedFromLibraryLede,
                clear: reviewLabels.selectedFromLibraryClear,
              }}
              onClear={() =>
                handleToggleSelection(preselectedSkillId, "manual")
              }
            />
          ) : null}
          <StepReview
            locale={locale}
            recommendations={recommendations}
            manualSkills={manualSkills}
            availableSkills={availableSkills}
            selections={selections}
            onToggle={handleToggleSelection}
            onAddManual={handleAddManualSkill}
            labels={reviewLabels}
          />
          <StepVariables
            locale={locale}
            skills={activeVariableSkills}
            values={variableValues}
            answers={answers}
            onChange={handleVariableChange}
            labels={variablesLabels}
          />
        </>
      }
      generateSlot={
        <StepGenerate
          locale={locale}
          plan={filePlan}
          activeSkills={activeSkills}
          resolutions={resolvedCatalog.resolutions}
          missing={resolvedCatalog.skillsWithMissing}
          labels={generateLabels}
          previewContents={previewContents}
        />
      }
    />
  );
}

type SelectedFromLibraryNoticeProps = {
  skillName: string;
  labels: { label: string; lede: string; clear: string };
  onClear: () => void;
};

function SelectedFromLibraryNotice({
  skillName,
  labels,
  onClear,
}: SelectedFromLibraryNoticeProps) {
  return (
    <aside
      data-slot="selected-from-library"
      aria-label={labels.label}
      className="flex flex-wrap items-start gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4 shadow-[var(--shadow-sm)] sm:p-5"
    >
      <div className="min-w-0 flex-1 grid gap-1.5">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-primary rtl:tracking-normal rtl:normal-case">
          {labels.label}
        </p>
        <p className="font-heading text-[15px] leading-5 text-foreground">
          {skillName}
        </p>
        <p className="text-[13px] leading-5 text-muted-foreground">
          {labels.lede}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        data-slot="selected-from-library-clear"
        className={
          "inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-foreground " +
          "transition-colors hover:border-destructive/40 hover:text-destructive " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        }
      >
        <X aria-hidden="true" className="size-3.5" />
        {labels.clear}
      </button>
    </aside>
  );
}
