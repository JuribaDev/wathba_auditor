"use client";

import * as React from "react";
import { Switch } from "radix-ui";

import { cn } from "@/lib/utils";

type ToggleProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
};

export function Toggle({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
  id,
  ariaLabel,
}: ToggleProps) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;

  const control = (
    <Switch.Root
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      checked={checked}
      data-slot="toggle"
      disabled={disabled}
      id={controlId}
      onCheckedChange={onCheckedChange}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-border-strong transition-colors",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        "data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <Switch.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-surface shadow",
          "transition-transform",
          "translate-x-0.5 data-[state=checked]:translate-x-[18px]",
          "rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-[18px]",
        )}
      />
    </Switch.Root>
  );

  if (!label && !description) {
    return <div className={className}>{control}</div>;
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      htmlFor={controlId}
    >
      <span className="mt-0.5">{control}</span>
      <span className="grid gap-0.5 leading-tight">
        {label ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
        {description ? (
          <span className="text-xs text-muted-foreground leading-5">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
