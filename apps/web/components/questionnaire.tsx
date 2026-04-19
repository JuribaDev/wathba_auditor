"use client";

import * as React from "react";

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
  type ReviewSelections,
  type ReviewSelectionSource,
  type ReviewStepLabels,
} from "@/components/questionnaire/step-review";
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
import { generatedSkills } from "@/lib/skills/generated";
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
  const [answers, setAnswers] = React.useState<QuestionnaireAnswers>({});
  const [attemptedSteps, setAttemptedSteps] = React.useState<
    ReadonlySet<QuestionnaireStepId>
  >(() => new Set());
  const [selections, setSelections] = React.useState<ReviewSelections>({});
  const [variableValues, setVariableValues] =
    React.useState<VariableValues>({});
  const [step, setStep] = React.useState<QuestionnaireStepId>("about");
  const seededRecommendationsRef = React.useRef<boolean>(false);
  const [hydrated, setHydrated] = React.useState<boolean>(false);

  React.useEffect(() => {
    const persistedState = loadQuestionnaireState();
    const persistedRoute = loadQuestionnaireRoute();
    if (persistedState) {
      // Hydration from localStorage after mount is the React-recommended
      // pattern for static export + SSR: defaults render on the server and
      // client-only state is applied in an effect to avoid hydration
      // mismatches. React will batch these setState calls.
      /* eslint-disable react-hooks/set-state-in-effect */
      setAnswers(persistedState.answers);
      setSelections(persistedState.selections);
      setVariableValues(persistedState.variableValues);
      setAttemptedSteps(new Set(persistedState.attemptedSteps));
      seededRecommendationsRef.current = persistedState.seededRecommendations;
    }
    if (persistedRoute) {
      setStep(persistedRoute);
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

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
    (skillId: string, source: ReviewSelectionSource) => {
      setSelections((prev) => {
        const existing = prev[skillId];
        if (existing) {
          return { ...prev, [skillId]: { ...existing, on: !existing.on } };
        }
        return { ...prev, [skillId]: { on: true, source } };
      });
    },
    [],
  );

  const handleAddManualSkill = React.useCallback((skillId: string) => {
    setSelections((prev) => {
      const existing = prev[skillId];
      if (existing) {
        return {
          ...prev,
          [skillId]: { ...existing, on: true },
        };
      }
      return { ...prev, [skillId]: { on: true, source: "manual" } };
    });
  }, []);

  const recommendationIds = React.useMemo(
    () => new Set(recommendations.map((skill) => skill.id)),
    [recommendations],
  );

  const manualSkills = React.useMemo(
    () =>
      generatedSkills.filter((skill) => {
        if (recommendationIds.has(skill.id)) return false;
        return selections[skill.id]?.source === "manual";
      }),
    [recommendationIds, selections],
  );

  const availableSkills = React.useMemo(() => {
    const manualIds = new Set(manualSkills.map((skill) => skill.id));
    return generatedSkills.filter(
      (skill) => !recommendationIds.has(skill.id) && !manualIds.has(skill.id),
    );
  }, [recommendationIds, manualSkills]);

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
          setSelections((prev) => {
            const next: ReviewSelections = { ...prev };
            for (const skill of recommendations) {
              if (!next[skill.id]) {
                next[skill.id] = { on: true, source: "auto" };
              }
            }
            return next;
          });
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
