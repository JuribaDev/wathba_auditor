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
  StepTech,
  type TechStepLabels,
} from "@/components/questionnaire/step-tech";
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
import type { QuestionnaireAnswers } from "@/lib/skills/recommendations";

export type QuestionnaireProps = {
  locale: AppLocale;
  shellLabels: QuestionnaireLabels;
  aboutLabels: AboutStepLabels;
  techLabels: TechStepLabels;
  validationMessages: ValidationMessages;
};

export function Questionnaire({
  locale,
  shellLabels,
  aboutLabels,
  techLabels,
  validationMessages,
}: QuestionnaireProps) {
  const [answers, setAnswers] = React.useState<QuestionnaireAnswers>({});
  const [attemptedSteps, setAttemptedSteps] = React.useState<
    ReadonlySet<QuestionnaireStepId>
  >(() => new Set());

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

  const handleBeforeNext = React.useCallback(
    (step: QuestionnaireStepId): boolean => {
      const stepErrors =
        step === "about"
          ? aboutErrors
          : step === "tech"
          ? techErrors
          : undefined;
      if (stepErrors && hasAnyError(stepErrors)) {
        setAttemptedSteps((prev) => {
          if (prev.has(step)) return prev;
          const next = new Set(prev);
          next.add(step);
          return next;
        });
        return false;
      }
      return true;
    },
    [aboutErrors, techErrors],
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
    />
  );
}
