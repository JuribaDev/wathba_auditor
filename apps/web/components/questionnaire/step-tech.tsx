"use client";

import * as React from "react";

import {
  CheckboxCardGroup,
  type CheckboxCardOption,
} from "@/components/ui/checkbox-card";
import {
  RadioCardGroup,
  type RadioCardOption,
} from "@/components/ui/radio-card";
import type {
  QuestionnaireAnswers,
  SecretsHandling,
  Stack,
  TargetAgent,
} from "@/lib/skills/recommendations";

import { Question } from "./question";
import { YesNoGroup } from "./yes-no-group";

export const TECH_STACK_VALUES = [
  "nodejs",
  "python",
  "php",
  "go",
  "other",
] as const satisfies readonly Stack[];

export const TECH_AGENT_VALUES = [
  "claude-code",
  "cursor",
  "codex",
  "agents-md",
] as const satisfies readonly TargetAgent[];

export const TECH_SECRETS_VALUES = [
  "manager",
  "env",
  "dotenv",
  "none",
] as const satisfies readonly SecretsHandling[];

export type TechStepLabels = {
  stackTitle: string;
  stackDesc: string;
  stackOptionNodejsLabel: string;
  stackOptionNodejsDesc: string;
  stackOptionPythonLabel: string;
  stackOptionPythonDesc: string;
  stackOptionPhpLabel: string;
  stackOptionPhpDesc: string;
  stackOptionGoLabel: string;
  stackOptionGoDesc: string;
  stackOptionOtherLabel: string;
  stackOptionOtherDesc: string;
  agentsTitle: string;
  agentsDesc: string;
  agentsOptionClaudeLabel: string;
  agentsOptionClaudeDesc: string;
  agentsOptionCursorLabel: string;
  agentsOptionCursorDesc: string;
  agentsOptionCodexLabel: string;
  agentsOptionCodexDesc: string;
  agentsOptionGenericLabel: string;
  agentsOptionGenericDesc: string;
  ciTitle: string;
  ciDesc: string;
  ciWhy: string;
  secretsTitle: string;
  secretsDesc: string;
  secretsOptionManagerLabel: string;
  secretsOptionManagerDesc: string;
  secretsOptionEnvLabel: string;
  secretsOptionEnvDesc: string;
  secretsOptionDotenvLabel: string;
  secretsOptionDotenvDesc: string;
  secretsOptionNoneLabel: string;
  secretsOptionNoneDesc: string;
  yes: string;
  no: string;
  whyAsk: string;
};

type StepTechProps = {
  answers: QuestionnaireAnswers;
  onChange: (patch: Partial<QuestionnaireAnswers>) => void;
  labels: TechStepLabels;
};

export function StepTech({ answers, onChange, labels }: StepTechProps) {
  const stackOptions: RadioCardOption[] = [
    {
      value: "nodejs",
      label: labels.stackOptionNodejsLabel,
      description: labels.stackOptionNodejsDesc,
    },
    {
      value: "python",
      label: labels.stackOptionPythonLabel,
      description: labels.stackOptionPythonDesc,
    },
    {
      value: "php",
      label: labels.stackOptionPhpLabel,
      description: labels.stackOptionPhpDesc,
    },
    {
      value: "go",
      label: labels.stackOptionGoLabel,
      description: labels.stackOptionGoDesc,
    },
    {
      value: "other",
      label: labels.stackOptionOtherLabel,
      description: labels.stackOptionOtherDesc,
    },
  ];

  const agentOptions: CheckboxCardOption[] = [
    {
      value: "claude-code",
      label: labels.agentsOptionClaudeLabel,
      description: labels.agentsOptionClaudeDesc,
    },
    {
      value: "cursor",
      label: labels.agentsOptionCursorLabel,
      description: labels.agentsOptionCursorDesc,
    },
    {
      value: "codex",
      label: labels.agentsOptionCodexLabel,
      description: labels.agentsOptionCodexDesc,
    },
    {
      value: "agents-md",
      label: labels.agentsOptionGenericLabel,
      description: labels.agentsOptionGenericDesc,
    },
  ];

  const secretsOptions: RadioCardOption[] = [
    {
      value: "manager",
      label: labels.secretsOptionManagerLabel,
      description: labels.secretsOptionManagerDesc,
    },
    {
      value: "env",
      label: labels.secretsOptionEnvLabel,
      description: labels.secretsOptionEnvDesc,
    },
    {
      value: "dotenv",
      label: labels.secretsOptionDotenvLabel,
      description: labels.secretsOptionDotenvDesc,
    },
    {
      value: "none",
      label: labels.secretsOptionNoneLabel,
      description: labels.secretsOptionNoneDesc,
    },
  ];

  return (
    <div className="flex flex-col gap-8" data-slot="step-tech">
      <Question
        title={labels.stackTitle}
        description={labels.stackDesc}
      >
        <RadioCardGroup
          name="stack"
          aria-label={labels.stackTitle}
          value={answers.stack ?? null}
          onValueChange={(value) => onChange({ stack: value as Stack })}
          options={stackOptions}
          orientation="horizontal"
        />
      </Question>

      <Question
        title={labels.agentsTitle}
        description={labels.agentsDesc}
      >
        <CheckboxCardGroup
          name="agents"
          aria-label={labels.agentsTitle}
          values={answers.agents ?? []}
          onValuesChange={(next) =>
            onChange({ agents: next as TargetAgent[] })
          }
          options={agentOptions}
          columns={2}
        />
      </Question>

      <Question
        title={labels.ciTitle}
        description={labels.ciDesc}
        why={labels.ciWhy}
        whyAskLabel={labels.whyAsk}
      >
        <YesNoGroup
          name="ci"
          ariaLabel={labels.ciTitle}
          value={answers.ci}
          onValueChange={(value) => onChange({ ci: value })}
          yesLabel={labels.yes}
          noLabel={labels.no}
        />
      </Question>

      <Question
        title={labels.secretsTitle}
        description={labels.secretsDesc}
      >
        <RadioCardGroup
          name="secrets"
          aria-label={labels.secretsTitle}
          value={answers.secrets ?? null}
          onValueChange={(value) =>
            onChange({ secrets: value as SecretsHandling })
          }
          options={secretsOptions}
        />
      </Question>
    </div>
  );
}
