import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type StepperStep = {
  id: string;
  label: React.ReactNode;
};

type StepperProps = {
  steps: StepperStep[];
  currentIndex: number;
  className?: string;
  ariaLabel?: string;
};

type StepState = "done" | "active" | "upcoming";

function stateFor(index: number, currentIndex: number): StepState {
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "active";
  return "upcoming";
}

export function Stepper({ steps, currentIndex, className, ariaLabel }: StepperProps) {
  return (
    <ol
      aria-label={ariaLabel}
      data-slot="stepper"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {steps.map((step, index) => {
        const state = stateFor(index, currentIndex);
        const isLast = index === steps.length - 1;
        return (
          <React.Fragment key={step.id}>
            <li
              aria-current={state === "active" ? "step" : undefined}
              data-state={state}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                "data-[state=upcoming]:border-border data-[state=upcoming]:bg-surface data-[state=upcoming]:text-muted-foreground",
                "data-[state=done]:border-border-strong data-[state=done]:bg-surface data-[state=done]:text-foreground",
                "data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[11px] font-serif font-medium",
                  state === "upcoming" && "bg-surface-variant text-muted-foreground",
                  state === "done" && "bg-success text-white",
                  state === "active" && "bg-primary-foreground/20 text-primary-foreground",
                )}
              >
                {state === "done" ? <Check className="size-3" strokeWidth={3} /> : index + 1}
              </span>
              <span>{step.label}</span>
            </li>
            {!isLast ? (
              <span
                aria-hidden="true"
                className="block h-px w-4 bg-border"
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

export { stateFor as getStepperState };
