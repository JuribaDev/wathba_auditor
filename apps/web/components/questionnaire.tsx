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
import type { QuestionnaireAnswers } from "@/lib/skills/recommendations";

export type QuestionnaireProps = {
  locale: AppLocale;
  shellLabels: QuestionnaireLabels;
  aboutLabels: AboutStepLabels;
  techLabels: TechStepLabels;
};

export function Questionnaire({
  locale,
  shellLabels,
  aboutLabels,
  techLabels,
}: QuestionnaireProps) {
  const [answers, setAnswers] = React.useState<QuestionnaireAnswers>({});

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

  return (
    <QuestionnaireShell
      locale={locale}
      labels={shellLabels}
      aboutSlot={
        <StepAbout
          answers={answers}
          onChange={handleAboutChange}
          labels={aboutLabels}
        />
      }
      techSlot={
        <StepTech
          answers={answers}
          onChange={handleTechChange}
          labels={techLabels}
        />
      }
    />
  );
}
