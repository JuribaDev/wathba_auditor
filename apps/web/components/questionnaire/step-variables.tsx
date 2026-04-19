"use client";

import * as React from "react";

import { YesNoGroup } from "@/components/questionnaire/yes-no-group";
import type { AppLocale } from "@/lib/i18n";
import {
  getVariableValue,
  makeVariableKey,
  type VariableValue,
  type VariableValues,
} from "@/lib/questionnaire/variables";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { QuestionnaireAnswers } from "@/lib/skills/recommendations";
import { cn } from "@/lib/utils";

export type VariablesStepLabels = {
  heading: string;
  lede: string;
  yes: string;
  no: string;
  selectPlaceholder: string;
};

type StepVariablesProps = {
  locale: AppLocale;
  skills: GeneratedSkill[];
  values: VariableValues;
  answers: QuestionnaireAnswers;
  onChange: (key: string, value: VariableValue) => void;
  labels: VariablesStepLabels;
};

export function StepVariables({
  locale,
  skills,
  values,
  answers,
  onChange,
  labels,
}: StepVariablesProps) {
  if (skills.length === 0) return null;

  return (
    <section
      data-slot="step-variables"
      className="mt-10 flex flex-col gap-5"
      aria-labelledby="variables-heading"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="variables-heading"
          className="font-heading text-xl leading-snug tracking-tight"
        >
          {labels.heading}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {labels.lede}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {skills.map((skill) => (
          <SkillVariablesCard
            key={skill.id}
            locale={locale}
            skill={skill}
            values={values}
            answers={answers}
            onChange={onChange}
            labels={labels}
          />
        ))}
      </div>
    </section>
  );
}

type SkillVariablesCardProps = {
  locale: AppLocale;
  skill: GeneratedSkill;
  values: VariableValues;
  answers: QuestionnaireAnswers;
  onChange: (key: string, value: VariableValue) => void;
  labels: VariablesStepLabels;
};

function SkillVariablesCard({
  locale,
  skill,
  values,
  answers,
  onChange,
  labels,
}: SkillVariablesCardProps) {
  return (
    <div
      data-slot="skill-variables-card"
      className={cn(
        "rounded-2xl border border-border bg-surface px-5 py-5",
        "shadow-sm",
      )}
    >
      <div className="mb-4 font-heading text-base leading-snug">
        {skill.name[locale]}
      </div>
      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        {skill.variables.map((variable) => {
          const key = makeVariableKey(skill.id, variable.name);
          const current = getVariableValue(values, skill.id, variable, answers);
          return (
            <VariableField
              key={variable.name}
              locale={locale}
              skillId={skill.id}
              variable={variable}
              value={current}
              onChange={onChange}
              labels={labels}
              fieldKey={key}
            />
          );
        })}
      </div>
    </div>
  );
}

type VariableFieldProps = {
  locale: AppLocale;
  skillId: string;
  variable: GeneratedSkill["variables"][number];
  value: VariableValue | undefined;
  onChange: (key: string, value: VariableValue) => void;
  labels: VariablesStepLabels;
  fieldKey: string;
};

function VariableField({
  locale,
  variable,
  value,
  onChange,
  labels,
  fieldKey,
}: VariableFieldProps) {
  const label = variable.label[locale];
  const labelId = `var-${fieldKey}-label`;

  if (variable.type === "select") {
    const stringValue = typeof value === "string" ? value : "";
    const options = variable.options ?? [];
    return (
      <div className="flex flex-col gap-1.5">
        <label
          id={labelId}
          htmlFor={fieldKey}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
        <select
          id={fieldKey}
          name={fieldKey}
          data-slot="variable-select"
          className={cn(
            "rounded-md border border-border bg-surface px-3 py-2 text-sm",
            "text-foreground focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
          value={stringValue}
          onChange={(event) => onChange(fieldKey, event.target.value)}
        >
          <option value="">{labels.selectPlaceholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variable.type === "boolean") {
    const boolValue = value === true;
    return (
      <div className="flex flex-col gap-1.5">
        <span
          id={labelId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </span>
        <YesNoGroup
          name={fieldKey}
          ariaLabel={label}
          value={typeof value === "boolean" ? value : null}
          onValueChange={(next) => onChange(fieldKey, next)}
          yesLabel={labels.yes}
          noLabel={labels.no}
        />
        <span className="sr-only" aria-live="polite">
          {boolValue ? labels.yes : labels.no}
        </span>
      </div>
    );
  }

  const textValue = typeof value === "string" ? value : "";
  return (
    <div className="flex flex-col gap-1.5">
      <label
        id={labelId}
        htmlFor={fieldKey}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <input
        id={fieldKey}
        name={fieldKey}
        type="text"
        data-slot="variable-text"
        className={cn(
          "rounded-md border border-border bg-surface px-3 py-2 text-sm",
          "text-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        value={textValue}
        onChange={(event) => onChange(fieldKey, event.target.value)}
      />
    </div>
  );
}
