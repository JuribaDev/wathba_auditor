"use client";

import * as React from "react";

import { RadioCardGroup } from "@/components/ui/radio-card";

type YesNoGroupProps = {
  value: boolean | null | undefined;
  onValueChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
  name?: string;
  ariaLabel?: string;
};

export function YesNoGroup({
  value,
  onValueChange,
  yesLabel,
  noLabel,
  name,
  ariaLabel,
}: YesNoGroupProps) {
  const stringValue =
    value === true ? "yes" : value === false ? "no" : null;

  return (
    <RadioCardGroup
      name={name}
      orientation="horizontal"
      aria-label={ariaLabel}
      value={stringValue}
      onValueChange={(next) => onValueChange(next === "yes")}
      options={[
        { value: "yes", label: yesLabel },
        { value: "no", label: noLabel },
      ]}
    />
  );
}
