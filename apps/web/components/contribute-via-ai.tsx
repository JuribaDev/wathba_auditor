"use client";

import * as React from "react";

import {
  AgentPromptCard,
  type AgentPromptCardLabels,
} from "@/components/agent-prompt-card";
import {
  buildAuthoringPrompt,
  formatPromptSize,
  type AuthoringPromptBundle,
  type ContributeAction,
  type ContributorDraft,
} from "@/lib/contribute/prompt";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";
import { cn } from "@/lib/utils";

export type ContributeViaAiLabels = {
  eyebrow: string;
  heading: string;
  lede: string;
  charsLabel: string;
  bumpLabel: string;
  copyCta: string;
  copyCopied: string;
  copyFallback: string;
  previewHeading: string;
  agentClaudeName: string;
  agentClaudeTagline: string;
  agentCursorName: string;
  agentCursorTagline: string;
  agentCodexName: string;
  agentCodexTagline: string;
  agentGenericName: string;
  agentGenericTagline: string;
  bumpPatch: string;
  bumpMinor: string;
  bumpMajor: string;
  fallbackNote: string;
};

type ContributeViaAiProps = {
  draft: ContributorDraft;
  baseline: GeneratedSkill | null;
  labels: ContributeViaAiLabels;
};

const ALL_TARGETS: TargetAgent[] = ["claude-code", "cursor", "codex", "agents-md"];

const NAME_KEY: Record<TargetAgent, keyof ContributeViaAiLabels> = {
  "claude-code": "agentClaudeName",
  cursor: "agentCursorName",
  codex: "agentCodexName",
  "agents-md": "agentGenericName",
};

const TAGLINE_KEY: Record<TargetAgent, keyof ContributeViaAiLabels> = {
  "claude-code": "agentClaudeTagline",
  cursor: "agentCursorTagline",
  codex: "agentCodexTagline",
  "agents-md": "agentGenericTagline",
};

function bumpKey(bump: AuthoringPromptBundle["estimatedBump"]): keyof ContributeViaAiLabels {
  switch (bump) {
    case "major":
      return "bumpMajor";
    case "minor":
      return "bumpMinor";
    case "patch":
    default:
      return "bumpPatch";
  }
}

function toCardLabels(labels: ContributeViaAiLabels): AgentPromptCardLabels {
  return {
    copyCta: labels.copyCta,
    copyCopied: labels.copyCopied,
    copyFallback: labels.copyFallback,
    previewHeading: labels.previewHeading,
  };
}

export function ContributeViaAi({ draft, baseline, labels }: ContributeViaAiProps) {
  const bundles = React.useMemo<AuthoringPromptBundle[]>(() => {
    return ALL_TARGETS.map((agent) =>
      buildAuthoringPrompt({ ...draft, targetAgent: agent }, baseline),
    );
  }, [draft, baseline]);

  const [expanded, setExpanded] = React.useState<TargetAgent | null>(() => "claude-code");

  const cardLabels = toCardLabels(labels);

  return (
    <section
      aria-label={labels.heading}
      data-slot="contribute-via-ai"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm",
      )}
      data-action={draft.action satisfies ContributeAction}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px",
          "bg-gradient-to-r from-transparent via-primary/60 to-transparent",
        )}
      />
      <header className="px-5 pt-5 sm:px-6 sm:pt-6">
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-[0.18em] text-primary",
            "rtl:tracking-normal rtl:normal-case",
          )}
        >
          {labels.eyebrow}
        </p>
        <h2 className="mt-2 font-heading text-xl leading-snug sm:text-2xl">
          {labels.heading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {labels.lede}
        </p>
      </header>
      <ul
        role="list"
        data-slot="contribute-agent-list"
        className="mt-5 divide-y divide-border border-t border-border"
      >
        {bundles.map((bundle) => {
          const chars = `${bundle.charCount.toLocaleString()} ${labels.charsLabel}`;
          const size = formatPromptSize(bundle.byteSize);
          const bump = labels[bumpKey(bundle.estimatedBump)];
          return (
            <AgentPromptCard
              key={bundle.agent}
              bundle={{
                target: bundle.agent,
                text: bundle.text,
                byteSize: bundle.byteSize,
              }}
              expanded={expanded === bundle.agent}
              onToggle={() =>
                setExpanded((current) =>
                  current === bundle.agent ? null : bundle.agent,
                )
              }
              agent={{
                name: labels[NAME_KEY[bundle.agent]],
                tagline: labels[TAGLINE_KEY[bundle.agent]],
              }}
              meta={{
                primary: `${chars} · ${size}`,
                secondary: `${labels.bumpLabel}: ${bump}`,
              }}
              labels={cardLabels}
              testSlot="contribute"
            />
          );
        })}
      </ul>
      <footer className="border-t border-border bg-surface-variant/60 px-5 py-3 text-[12.5px] leading-6 text-muted-foreground sm:px-6">
        {labels.fallbackNote}
      </footer>
    </section>
  );
}
