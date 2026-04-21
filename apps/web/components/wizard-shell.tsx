"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import type { AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type WizardStep<Id extends string> = {
  id: Id;
  label: React.ReactNode;
  heading: React.ReactNode;
  lede?: React.ReactNode;
  content: React.ReactNode;
  valid?: boolean;
  blockedHint?: string;
};

export type WizardShellLabels = {
  ariaLabel: string;
  eyebrowOf: string;
  stepPosition: string;
  next: string;
  previous: string;
  startOver?: string;
  finish?: string;
};

type WizardShellProps<Id extends string> = {
  locale: AppLocale;
  steps: ReadonlyArray<WizardStep<Id>>;
  labels: WizardShellLabels;
  activeStep: Id;
  onStepChange: (next: Id) => void;
  onReset?: () => void;
  onFinish?: () => void;
  trailingSlot?: React.ReactNode;
};

function formatEyebrow(template: string, index: number, total: number): string {
  return template
    .replace("{step}", String(index + 1).padStart(2, "0"))
    .replace("{total}", String(total).padStart(2, "0"));
}

export function WizardShell<Id extends string>({
  locale,
  steps,
  labels,
  activeStep,
  onStepChange,
  onReset,
  onFinish,
  trailingSlot,
}: WizardShellProps<Id>) {
  const index = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStep),
  );
  const step = steps[index] ?? steps[0];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const [blockedAt, setBlockedAt] = React.useState(0);
  const liveRegionRef = React.useRef<HTMLParagraphElement | null>(null);

  const goNext = React.useCallback(() => {
    if (step.valid === false) {
      setBlockedAt((value) => value + 1);
      return;
    }
    if (isLast) {
      onFinish?.();
      return;
    }
    onStepChange(steps[index + 1].id);
  }, [index, isLast, onFinish, onStepChange, step.valid, steps]);

  const goPrev = React.useCallback(() => {
    if (isFirst) return;
    onStepChange(steps[index - 1].id);
  }, [index, isFirst, onStepChange, steps]);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
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
      if (event.key === forwardKey && !isLast) {
        event.preventDefault();
        goNext();
      } else if (event.key === backwardKey && !isFirst) {
        event.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev, isFirst, isLast, locale],
  );

  const stepPosition = labels.stepPosition
    .replace("{step}", String(index + 1))
    .replace("{total}", String(steps.length));
  const eyebrow = formatEyebrow(labels.eyebrowOf, index, steps.length);

  const stepperSteps: StepperStep[] = React.useMemo(
    () => steps.map((s) => ({ id: s.id, label: s.label })),
    [steps],
  );

  const headingId = `wizard-step-${step.id}-heading`;

  return (
    <div
      className="flex flex-col gap-10"
      data-slot="wizard-shell"
      onKeyDown={onKeyDown}
    >
      <Stepper
        steps={stepperSteps}
        currentIndex={index}
        ariaLabel={labels.ariaLabel}
      />

      <p ref={liveRegionRef} className="sr-only" aria-live="polite" role="status">
        {stepPosition}
      </p>
      <p
        className="sr-only"
        aria-live="assertive"
        role="alert"
        data-blocked-at={blockedAt}
      >
        {step.valid === false && step.blockedHint ? step.blockedHint : ""}
      </p>

      <section aria-labelledby={headingId} className="grid gap-8">
        <header className="grid gap-3">
          <p
            className={cn(
              "text-[0.7rem] font-medium uppercase tracking-[0.2em] text-primary",
              "rtl:tracking-normal rtl:normal-case",
            )}
          >
            {eyebrow}
          </p>
          <h1
            id={headingId}
            className="font-heading text-3xl font-medium leading-tight tracking-tight sm:text-4xl"
          >
            {step.heading}
          </h1>
          {step.lede ? (
            <p className="max-w-[60ch] text-base leading-7 text-muted-foreground">
              {step.lede}
            </p>
          ) : null}
        </header>

        <div data-slot="wizard-step-body">{step.content}</div>
      </section>

      {trailingSlot}

      <nav
        aria-label={labels.ariaLabel}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <Button
          type="button"
          variant="ghost"
          onClick={goPrev}
          disabled={isFirst}
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          {labels.previous}
        </Button>

        <div className="flex items-center gap-2">
          {onReset && labels.startOver ? (
            <Button type="button" variant="secondary" onClick={onReset}>
              {labels.startOver}
            </Button>
          ) : null}
          <Button type="button" onClick={goNext}>
            {isLast && labels.finish ? labels.finish : labels.next}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
        </div>
      </nav>
    </div>
  );
}
