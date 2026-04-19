"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import {
  QUESTIONNAIRE_STEP_COUNT,
  QUESTIONNAIRE_STEP_IDS,
  type QuestionnaireStepId,
  indexForStep,
  isFinalStep,
  isFirstStep,
  nextStepIndex,
  prevStepIndex,
  stepForIndex,
} from "@/lib/questionnaire/steps";
import type { AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type QuestionnaireLabels = {
  ariaLabel: string;
  stepAbout: string;
  stepTech: string;
  stepReview: string;
  stepGenerate: string;
  aboutHeading: string;
  aboutLede: string;
  aboutPlaceholder: string;
  techHeading: string;
  techLede: string;
  techPlaceholder: string;
  reviewHeading: string;
  reviewLede: string;
  reviewPlaceholder: string;
  generateHeading: string;
  generateLede: string;
  generatePlaceholder: string;
  eyebrowOf: string;
  prev: string;
  next: string;
  downloadCta: string;
  stepPositionLabel: string;
};

const HEADING_KEY: Record<QuestionnaireStepId, keyof QuestionnaireLabels> = {
  about: "aboutHeading",
  tech: "techHeading",
  review: "reviewHeading",
  generate: "generateHeading",
};

const LEDE_KEY: Record<QuestionnaireStepId, keyof QuestionnaireLabels> = {
  about: "aboutLede",
  tech: "techLede",
  review: "reviewLede",
  generate: "generateLede",
};

const PLACEHOLDER_KEY: Record<QuestionnaireStepId, keyof QuestionnaireLabels> = {
  about: "aboutPlaceholder",
  tech: "techPlaceholder",
  review: "reviewPlaceholder",
  generate: "generatePlaceholder",
};

function formatEyebrow(template: string, index: number, total: number): string {
  return template
    .replace("{step}", String(index + 1).padStart(2, "0"))
    .replace("{total}", String(total).padStart(2, "0"));
}

export function QuestionnaireShell({
  locale,
  labels,
  initialStep = "about",
  aboutSlot,
  techSlot,
  reviewSlot,
  generateSlot,
}: {
  locale: AppLocale;
  labels: QuestionnaireLabels;
  initialStep?: QuestionnaireStepId;
  aboutSlot?: React.ReactNode;
  techSlot?: React.ReactNode;
  reviewSlot?: React.ReactNode;
  generateSlot?: React.ReactNode;
}) {
  const [index, setIndex] = React.useState<number>(() => indexForStep(initialStep));
  const activeStep = stepForIndex(index);
  const liveRegionRef = React.useRef<HTMLParagraphElement | null>(null);

  const slotByStep: Record<QuestionnaireStepId, React.ReactNode | undefined> = {
    about: aboutSlot,
    tech: techSlot,
    review: reviewSlot,
    generate: generateSlot,
  };
  const activeSlot = slotByStep[activeStep];

  const steps: StepperStep[] = React.useMemo(
    () => [
      { id: "about", label: labels.stepAbout },
      { id: "tech", label: labels.stepTech },
      { id: "review", label: labels.stepReview },
      { id: "generate", label: labels.stepGenerate },
    ],
    [labels.stepAbout, labels.stepTech, labels.stepReview, labels.stepGenerate],
  );

  const goNext = React.useCallback(() => {
    setIndex((current) => nextStepIndex(current));
  }, []);

  const goPrev = React.useCallback(() => {
    setIndex((current) => prevStepIndex(current));
  }, []);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const forwardKey = locale === "ar" ? "ArrowLeft" : "ArrowRight";
      const backwardKey = locale === "ar" ? "ArrowRight" : "ArrowLeft";
      if (event.key === forwardKey && !isFinalStep(index)) {
        event.preventDefault();
        goNext();
      } else if (event.key === backwardKey && !isFirstStep(index)) {
        event.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev, index, locale],
  );

  const headingId = `questionnaire-step-${activeStep}-heading`;
  const eyebrow = formatEyebrow(labels.eyebrowOf, index, QUESTIONNAIRE_STEP_COUNT);
  const stepPosition = labels.stepPositionLabel
    .replace("{step}", String(index + 1))
    .replace("{total}", String(QUESTIONNAIRE_STEP_COUNT));

  return (
    <div
      className="flex flex-col gap-10"
      onKeyDown={onKeyDown}
      data-slot="questionnaire-shell"
    >
      <Stepper steps={steps} currentIndex={index} ariaLabel={labels.ariaLabel} />

      <p ref={liveRegionRef} className="sr-only" aria-live="polite" role="status">
        {stepPosition}
      </p>

      <section aria-labelledby={headingId} className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-[0.18em] text-primary",
              "rtl:tracking-normal rtl:normal-case",
            )}
          >
            {eyebrow}
          </p>
          <h1
            id={headingId}
            className="font-heading text-3xl leading-tight tracking-tight sm:text-4xl"
          >
            {labels[HEADING_KEY[activeStep]]}
          </h1>
          <p className="max-w-[60ch] text-base leading-7 text-muted-foreground">
            {labels[LEDE_KEY[activeStep]]}
          </p>
        </header>

        {activeSlot ? (
          <div data-slot="questionnaire-step-body">{activeSlot}</div>
        ) : (
          <div
            role="region"
            aria-live="polite"
            className={cn(
              "rounded-2xl border border-dashed border-border bg-surface-variant/60",
              "px-6 py-12 text-center text-sm leading-7 text-muted-foreground",
            )}
          >
            {labels[PLACEHOLDER_KEY[activeStep]]}
          </div>
        )}
      </section>

      <nav
        aria-label={labels.ariaLabel}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6"
      >
        <Button
          type="button"
          variant="ghost"
          onClick={goPrev}
          disabled={isFirstStep(index)}
        >
          <ArrowLeft
            className="size-4 rtl:-scale-x-100"
            aria-hidden="true"
          />
          {labels.prev}
        </Button>
        {!isFinalStep(index) ? (
          <Button type="button" variant="default" onClick={goNext}>
            {activeStep === "review" ? labels.downloadCta : labels.next}
            <ArrowRight
              className="size-4 rtl:-scale-x-100"
              aria-hidden="true"
            />
          </Button>
        ) : null}
      </nav>
    </div>
  );
}

export { QUESTIONNAIRE_STEP_IDS };
