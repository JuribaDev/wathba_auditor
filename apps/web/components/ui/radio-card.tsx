"use client";

import * as React from "react";
import { RadioGroup } from "radix-ui";

import { cn } from "@/lib/utils";

export type RadioCardOption = {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
};

type RadioCardGroupProps = {
  value: string | null;
  onValueChange: (value: string) => void;
  options: RadioCardOption[];
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  orientation?: "vertical" | "horizontal";
};

export function RadioCardGroup({
  value,
  onValueChange,
  options,
  name,
  className,
  orientation = "vertical",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: RadioCardGroupProps) {
  return (
    <RadioGroup.Root
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-slot="radio-card-group"
      name={name}
      onValueChange={onValueChange}
      orientation={orientation}
      value={value ?? undefined}
      className={cn(
        "grid gap-2.5",
        orientation === "horizontal" && "sm:grid-cols-2",
        className,
      )}
    >
      {options.map((option) => {
        const id = `${name ?? "radio-card"}-${option.value}`;
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            htmlFor={id}
            data-state={checked ? "checked" : "unchecked"}
            className={cn(
              "group/radio-card flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 text-start transition-colors",
              "hover:border-border-strong",
              "data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft data-[state=checked]:shadow-[inset_0_0_0_1px_var(--primary)]",
              "focus-within:ring-3 focus-within:ring-ring/50",
              option.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <RadioGroup.Item
              id={id}
              value={option.value}
              disabled={option.disabled}
              className={cn(
                "relative mt-0.5 size-[18px] shrink-0 rounded-full border-[1.5px] border-border-strong outline-none",
                "data-[state=checked]:border-primary",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              <RadioGroup.Indicator
                className={cn(
                  "absolute inset-[3px] rounded-full bg-primary",
                  "data-[state=unchecked]:hidden",
                )}
              />
            </RadioGroup.Item>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-foreground">
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-1 block text-xs text-muted-foreground leading-5">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </RadioGroup.Root>
  );
}
