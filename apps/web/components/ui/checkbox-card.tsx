"use client";

import * as React from "react";
import { Checkbox } from "radix-ui";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type CheckboxCardOption = {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
};

type CheckboxCardGroupProps = {
  values: string[];
  onValuesChange: (next: string[]) => void;
  options: CheckboxCardOption[];
  name?: string;
  className?: string;
  columns?: 1 | 2;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export function CheckboxCardGroup({
  values,
  onValuesChange,
  options,
  name,
  className,
  columns = 1,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: CheckboxCardGroupProps) {
  const toggle = React.useCallback(
    (value: string, next: boolean) => {
      if (next) {
        if (values.includes(value)) return;
        onValuesChange([...values, value]);
      } else {
        onValuesChange(values.filter((existing) => existing !== value));
      }
    },
    [values, onValuesChange],
  );

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-slot="checkbox-card-group"
      className={cn(
        "grid gap-2.5",
        columns === 2 && "sm:grid-cols-2",
        className,
      )}
    >
      {options.map((option) => {
        const id = `${name ?? "checkbox-card"}-${option.value}`;
        const checked = values.includes(option.value);
        return (
          <label
            key={option.value}
            htmlFor={id}
            data-state={checked ? "checked" : "unchecked"}
            className={cn(
              "group/checkbox-card flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 text-start transition-colors",
              "hover:border-border-strong",
              "data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft",
              "focus-within:ring-3 focus-within:ring-ring/50",
              option.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Checkbox.Root
              id={id}
              checked={checked}
              disabled={option.disabled}
              onCheckedChange={(state) => toggle(option.value, state === true)}
              className={cn(
                "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border-[1.5px] border-border-strong bg-surface transition-colors outline-none",
                "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              <Checkbox.Indicator>
                <Check
                  aria-hidden="true"
                  className="size-3 text-primary-foreground"
                  strokeWidth={3}
                />
              </Checkbox.Indicator>
            </Checkbox.Root>
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
    </div>
  );
}
