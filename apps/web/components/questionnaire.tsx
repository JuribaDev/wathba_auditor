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
  const seededRecommendationsRef = React.useRef<boolean>(false);

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
      onBeforeNext={handleBeforeNext}
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
            selections={selections}
            onToggle={handleToggleSelection}
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
