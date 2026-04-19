"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AppLocale } from "@/lib/i18n";
import type { GeneratedSkill } from "@/lib/skills/generated";
import { mapStatus } from "@/lib/skills/labels";
import { cn } from "@/lib/utils";

export type ReviewSelectionSource = "auto" | "manual";

export type ReviewSelection = {
  on: boolean;
  source: ReviewSelectionSource;
};

export type ReviewSelections = Record<string, ReviewSelection>;

export type ReviewStepLabels = {
  autoLabel: string;
  manualLabel: string;
  statusReviewed: string;
  statusCommunity: string;
  statusDraft: string;
  versionPrefix: string;
  verifiedPrefix: string;
  disclaimer: string;
  enable: string;
  disable: string;
  empty: string;
};

type StepReviewProps = {
  locale: AppLocale;
  recommendations: GeneratedSkill[];
  selections: ReviewSelections;
  onToggle: (skillId: string, source: ReviewSelectionSource) => void;
  labels: ReviewStepLabels;
};

const STATUS_LABEL_KEY = {
  reviewed: "statusReviewed",
  community: "statusCommunity",
  draft: "statusDraft",
} as const;

export function StepReview({
  locale,
  recommendations,
  selections,
  onToggle,
  labels,
}: StepReviewProps) {
  if (recommendations.length === 0) {
    return (
      <div
        role="region"
        aria-live="polite"
        className={cn(
          "rounded-2xl border border-dashed border-border bg-surface-variant/60",
          "px-6 py-12 text-center text-sm leading-7 text-muted-foreground",
        )}
      >
        {labels.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-slot="step-review">
      {recommendations.map((skill) => {
        const selection = selections[skill.id];
        const on = selection?.on ?? true;
        const source: ReviewSelectionSource = selection?.source ?? "auto";
        const status = mapStatus(skill.status);
        const statusLabel = labels[STATUS_LABEL_KEY[status]];
        const summary = skill.summary?.[locale] ?? "";
        const sourceLabel =
          source === "manual" ? labels.manualLabel : labels.autoLabel;
        return (
          <ReviewSkillRow
            key={skill.id}
            locale={locale}
            skill={skill}
            on={on}
            source={source}
            sourceLabel={sourceLabel}
            summary={summary}
            statusLabel={statusLabel}
            status={status}
            versionPrefix={labels.versionPrefix}
            verifiedPrefix={labels.verifiedPrefix}
            disclaimerLabel={labels.disclaimer}
            toggleLabel={on ? labels.disable : labels.enable}
            onToggle={() => onToggle(skill.id, source)}
          />
        );
      })}
    </div>
  );
}

type ReviewSkillRowProps = {
  locale: AppLocale;
  skill: GeneratedSkill;
  on: boolean;
  source: ReviewSelectionSource;
  sourceLabel: string;
  summary: string;
  statusLabel: string;
  status: ReturnType<typeof mapStatus>;
  versionPrefix: string;
  verifiedPrefix: string;
  disclaimerLabel: string;
  toggleLabel: string;
  onToggle: () => void;
};

function ReviewSkillRow({
  locale,
  skill,
  on,
  source,
  sourceLabel,
  summary,
  statusLabel,
  status,
  versionPrefix,
  verifiedPrefix,
  disclaimerLabel,
  toggleLabel,
  onToggle,
}: ReviewSkillRowProps) {
  const titleId = `review-skill-${skill.id}-title`;
  return (
    <div
      data-slot="review-skill-row"
      data-on={on ? "true" : "false"}
      data-source={source}
      className={cn(
        "flex gap-4 rounded-2xl border border-border bg-surface px-4 py-4",
        "shadow-sm transition-colors",
        !on && "opacity-70",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        aria-labelledby={titleId}
        aria-label={toggleLabel}
        onClick={onToggle}
        className={cn(
          "mt-1 inline-flex size-[22px] shrink-0 items-center justify-center rounded-md border",
          "border-[color:var(--border-strong,theme(colors.border))] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          on ? "bg-primary text-primary-foreground" : "bg-transparent",
        )}
      >
        {on ? <Check className="size-3.5" aria-hidden="true" /> : null}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            id={titleId}
            className="font-heading text-[1.0625rem] leading-snug tracking-tight"
          >
            {skill.name[locale]}
          </h3>
          <Badge variant={source === "manual" ? "outline" : "default"}>
            {sourceLabel}
          </Badge>
          <StatusBadge status={status}>{statusLabel}</StatusBadge>
        </div>
        {summary ? (
          <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
        ) : null}
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-1 pt-1",
            "font-mono text-[11.5px] text-soft-foreground",
          )}
        >
          <span>
            {versionPrefix}
            {skill.version}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {verifiedPrefix} {skill.lastVerified}
          </span>
          {skill.disclaimer ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-warning">{disclaimerLabel}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="hidden shrink-0 font-mono text-[11px] text-soft-foreground sm:block">
        #{skill.slug}
      </div>
    </div>
  );
}
