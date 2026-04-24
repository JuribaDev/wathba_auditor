"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AppLocale } from "@/lib/i18n";
import {
  buildReviewRows,
  type Selection,
  type SelectionSource,
  type Selections,
} from "@/lib/questionnaire/selections";
import type { GeneratedSkill } from "@/lib/skills/generated";
import { mapStatus } from "@/lib/skills/labels";
import { cn } from "@/lib/utils";

// Legacy aliases kept for call-sites that imported the row-scoped names.
export type ReviewSelectionSource = SelectionSource;
export type ReviewSelection = Selection;
export type ReviewSelections = Selections;

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
  addAnotherSummary: string;
  addAnotherLede: string;
  addAnotherEmpty: string;
  addAction: string;
  selectedFromLibraryLabel: string;
  selectedFromLibraryLede: string;
  selectedFromLibraryClear: string;
};

type StepReviewProps = {
  locale: AppLocale;
  recommendations: GeneratedSkill[];
  manualSkills: GeneratedSkill[];
  availableSkills: GeneratedSkill[];
  selections: ReviewSelections;
  onToggle: (skillId: string, source: ReviewSelectionSource) => void;
  onAddManual: (skillId: string) => void;
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
  manualSkills,
  availableSkills,
  selections,
  onToggle,
  onAddManual,
  labels,
}: StepReviewProps) {
  const rows = buildReviewRows(recommendations, manualSkills, selections);
  const hasAnyRow = rows.length > 0;

  return (
    <div className="flex flex-col gap-4" data-slot="step-review">
      {hasAnyRow ? (
        <div className="flex flex-col gap-3">
          {rows.map(({ skill, on, source }) => {
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
      ) : (
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
      )}
      <AddAnotherSkillDrawer
        locale={locale}
        availableSkills={availableSkills}
        onAdd={onAddManual}
        labels={labels}
      />
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

type AddAnotherSkillDrawerProps = {
  locale: AppLocale;
  availableSkills: GeneratedSkill[];
  onAdd: (skillId: string) => void;
  labels: ReviewStepLabels;
};

function AddAnotherSkillDrawer({
  locale,
  availableSkills,
  onAdd,
  labels,
}: AddAnotherSkillDrawerProps) {
  return (
    <details
      data-slot="add-another-skill"
      className={cn(
        "group/add-skill rounded-2xl border border-dashed border-border bg-surface-variant/40",
        "px-4 py-3 text-sm",
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-2 rounded-md py-1",
          "text-foreground outline-none",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="inline-flex items-center gap-2">
          <Plus
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 transition-transform",
              "group-open/add-skill:rotate-45",
            )}
          />
          <span className="font-medium">{labels.addAnotherSummary}</span>
        </span>
        <span className="font-mono text-[11px] text-soft-foreground">
          {availableSkills.length}
        </span>
      </summary>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {labels.addAnotherLede}
      </p>
      {availableSkills.length === 0 ? (
        <p className="mt-3 rounded-md bg-surface px-3 py-2 text-sm text-muted-foreground">
          {labels.addAnotherEmpty}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2" role="list">
          {availableSkills.map((skill) => {
            const status = mapStatus(skill.status);
            const statusLabel = labels[STATUS_LABEL_KEY[status]];
            const summary = skill.summary?.[locale] ?? "";
            return (
              <li
                key={skill.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2.5",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-[0.95rem] leading-snug tracking-tight">
                      {skill.name[locale]}
                    </span>
                    <StatusBadge status={status}>{statusLabel}</StatusBadge>
                    {skill.disclaimer ? (
                      <span className="font-mono text-[10.5px] text-warning">
                        {labels.disclaimer}
                      </span>
                    ) : null}
                  </div>
                  {summary ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {summary}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(skill.id)}
                  aria-label={`${labels.addAction}: ${skill.name[locale]}`}
                  className={cn(
                    "mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1",
                    "font-mono text-[11px] text-foreground transition-colors",
                    "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                >
                  <Plus aria-hidden="true" className="size-3" />
                  <span>{labels.addAction}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
}
