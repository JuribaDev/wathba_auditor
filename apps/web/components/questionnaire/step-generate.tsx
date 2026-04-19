"use client";

import * as React from "react";
import { Folder, FileText } from "lucide-react";

import type { FilePlan, TargetFilePlan } from "@/lib/generate/file-plan";
import type { TargetAgent } from "@/lib/skills/recommendations";
import { cn } from "@/lib/utils";

export type GenerateStepLabels = {
  zipLabel: string;
  zipFilename: string;
  totalLabel: string;
  filesLabel: string;
  skillsLabel: string;
  targetClaude: string;
  targetCursor: string;
  targetCodex: string;
  targetGeneric: string;
  emptyTitle: string;
  emptyBody: string;
};

type StepGenerateProps = {
  plan: FilePlan;
  labels: GenerateStepLabels;
};

const TARGET_LABEL_KEY: Record<TargetAgent, keyof GenerateStepLabels> = {
  "claude-code": "targetClaude",
  cursor: "targetCursor",
  codex: "targetCodex",
  "agents-md": "targetGeneric",
};

export function StepGenerate({ plan, labels }: StepGenerateProps) {
  const hasContent = plan.totalFiles > 0 && plan.skillCount > 0;

  if (!hasContent) {
    return (
      <div
        role="region"
        aria-live="polite"
        data-slot="step-generate-empty"
        className={cn(
          "rounded-2xl border border-dashed border-border bg-surface-variant/60",
          "px-6 py-12 text-center",
        )}
      >
        <p className="font-heading text-lg leading-snug">{labels.emptyTitle}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {labels.emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-slot="step-generate">
      <section
        aria-label={labels.zipLabel}
        className={cn(
          "rounded-2xl border border-border bg-surface px-5 py-5 shadow-sm",
          "sm:px-6 sm:py-6",
        )}
      >
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-[0.18em] text-primary",
            "rtl:tracking-normal rtl:normal-case",
          )}
        >
          {labels.zipLabel}
        </p>
        <div className="mt-3 font-mono text-[13px] text-foreground">
          <div className="flex items-center gap-2">
            <Folder aria-hidden="true" className="size-3.5 text-primary" />
            <span className="break-all">{labels.zipFilename}</span>
          </div>
          <FileTree plan={plan} labels={labels} />
        </div>
        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-[13px] text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <span>{labels.totalLabel}</span>
            <strong className="text-foreground">
              {plan.totalFiles} {labels.filesLabel}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>{labels.skillsLabel}</span>
            <strong className="text-foreground">{plan.skillCount}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function FileTree({
  plan,
  labels,
}: {
  plan: FilePlan;
  labels: GenerateStepLabels;
}) {
  return (
    <div className="mt-2 space-y-3" data-slot="generate-file-tree">
      {plan.targets.map((target) => (
        <TargetTree
          key={target.target}
          target={target}
          targetLabel={labels[TARGET_LABEL_KEY[target.target]]}
        />
      ))}
    </div>
  );
}

function TargetTree({
  target,
  targetLabel,
}: {
  target: TargetFilePlan;
  targetLabel: string;
}) {
  return (
    <div
      data-slot="generate-target-tree"
      data-target={target.target}
      className="ps-3"
    >
      <div className="text-[11px] uppercase tracking-wider text-soft-foreground rtl:tracking-normal">
        {targetLabel}
      </div>
      <div className="mt-1 space-y-1">
        {target.groups.map((group) => (
          <div key={group.directory}>
            <div className="flex items-center gap-2 text-[12px] text-primary">
              <Folder aria-hidden="true" className="size-3" />
              <span className="break-all">
                {group.directory === "." ? "./" : `${group.directory}/`}
              </span>
            </div>
            <ul className="ps-5">
              {group.files.map((file) => (
                <li
                  key={`${group.directory}/${file}`}
                  className="flex items-center gap-2 text-[12px] text-muted-foreground"
                >
                  <FileText aria-hidden="true" className="size-3" />
                  <span className="break-all">{file}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
