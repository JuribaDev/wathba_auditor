"use client";

import * as React from "react";
import { CheckCircle2, Download, Folder, FileText, Loader2 } from "lucide-react";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { InstallViaAi, type InstallViaAiLabels } from "@/components/install-via-ai";
import {
  InstallChannels,
  type InstallChannelsLabels,
} from "@/components/questionnaire/install-channels";
import type { FilePlan, TargetFilePlan } from "@/lib/generate/file-plan";
import type {
  MissingVariables,
  SkillResolution,
} from "@/lib/generate/resolve-markdown";
import {
  SAMPLE_PREVIEW_BODIES,
  resolveActiveTarget,
} from "@/lib/generate/sample-previews";
import { buildZipBlob, buildZipFilename } from "@/lib/generate/zip";
import type { AppLocale } from "@/lib/i18n";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";
import { cn } from "@/lib/utils";

export type PreviewContents = Partial<Record<TargetAgent, Map<string, string>>>;

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
  targetPreviewHeading: string;
  targetNoteClaude: string;
  targetNoteCursor: string;
  targetNoteCodex: string;
  targetNoteGeneric: string;
  previewEmpty: string;
  previewFilePlaceholder: string;
  missingTitle: string;
  missingLede: string;
  missingVariableLabel: string;
  emptyTitle: string;
  emptyBody: string;
  downloadCta: string;
  downloadWorking: string;
  downloadReady: string;
  downloadHint: string;
  downloadDisabledMissing: string;
  downloadError: string;
  install: InstallViaAiLabels;
  channels: InstallChannelsLabels;
  advanced: {
    heading: string;
    lede: string;
    show: string;
    hide: string;
  };
};

type StepGenerateProps = {
  locale: AppLocale;
  plan: FilePlan;
  activeSkills: readonly GeneratedSkill[];
  resolutions: readonly SkillResolution[];
  missing: readonly MissingVariables[];
  labels: GenerateStepLabels;
  previewContents?: PreviewContents;
};

type StringLabelKey = {
  [K in keyof GenerateStepLabels]: GenerateStepLabels[K] extends string ? K : never;
}[keyof GenerateStepLabels];

const TARGET_LABEL_KEY: Record<TargetAgent, StringLabelKey> = {
  "claude-code": "targetClaude",
  cursor: "targetCursor",
  codex: "targetCodex",
  "agents-md": "targetGeneric",
};

const TARGET_NOTE_KEY: Record<TargetAgent, StringLabelKey> = {
  "claude-code": "targetNoteClaude",
  cursor: "targetNoteCursor",
  codex: "targetNoteCodex",
  "agents-md": "targetNoteGeneric",
};

export function StepGenerate({
  locale,
  plan,
  activeSkills,
  resolutions,
  missing,
  labels,
  previewContents,
}: StepGenerateProps) {
  const hasContent = plan.totalFiles > 0 && plan.skillCount > 0;

  const availableTargets = React.useMemo(
    () => plan.targets.map((target) => target.target),
    [plan.targets],
  );

  const [userTarget, setUserTarget] = React.useState<TargetAgent | null>(null);
  const activeTarget = resolveActiveTarget(availableTargets, userTarget);

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
      {missing.length > 0 ? (
        <MissingVariablesNotice
          locale={locale}
          missing={missing}
          labels={labels}
        />
      ) : null}

      <InstallChannels
        locale={locale}
        labels={labels.channels}
        selectedTargets={availableTargets}
      />

      <AdvancedDisclosure labels={labels.advanced}>
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

        <TargetPreview
          targets={plan.targets}
          activeTarget={activeTarget}
          onSelect={setUserTarget}
          labels={labels}
          previewContents={previewContents}
        />

        <DownloadPanel
          plan={plan}
          activeSkills={activeSkills}
          resolutions={resolutions}
          hasMissing={missing.length > 0}
          labels={labels}
        />

        {missing.length === 0 ? (
          <InstallViaAi
            locale={locale}
            plan={plan}
            activeSkills={activeSkills}
            resolutions={resolutions}
            labels={labels.install}
          />
        ) : null}
      </AdvancedDisclosure>
    </div>
  );
}

type AdvancedDisclosureProps = {
  labels: { heading: string; lede: string; show: string; hide: string };
  children: React.ReactNode;
};

function AdvancedDisclosure({ labels, children }: AdvancedDisclosureProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <section
      data-slot="advanced-disclosure"
      data-state={open ? "open" : "closed"}
      className={cn(
        "rounded-2xl border border-dashed border-border bg-surface-variant/30",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-start gap-3 px-5 py-4 text-start sm:px-6 sm:py-5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-[0.18em] text-soft-foreground",
              "rtl:tracking-normal rtl:normal-case",
            )}
          >
            {labels.heading}
          </p>
          <p className="mt-1 text-[13.5px] leading-6 text-muted-foreground">
            {labels.lede}
          </p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
        />
        <span className="sr-only">{open ? labels.hide : labels.show}</span>
      </button>
      {open ? (
        <div className="flex flex-col gap-5 border-t border-dashed border-border px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
          {children}
        </div>
      ) : null}
    </section>
  );
}

type DownloadPanelProps = {
  plan: FilePlan;
  activeSkills: readonly GeneratedSkill[];
  resolutions: readonly SkillResolution[];
  hasMissing: boolean;
  labels: GenerateStepLabels;
};

type DownloadStatus = "idle" | "working" | "ready" | "error";

function DownloadPanel({
  plan,
  activeSkills,
  resolutions,
  hasMissing,
  labels,
}: DownloadPanelProps) {
  const [status, setStatus] = React.useState<DownloadStatus>("idle");

  const handleDownload = React.useCallback(async () => {
    setStatus("working");
    try {
      const blob = await buildZipBlob(plan, activeSkills, resolutions);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildZipFilename();
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [plan, activeSkills, resolutions]);

  const disabled = hasMissing || status === "working";

  const hint = hasMissing
    ? labels.downloadDisabledMissing
    : status === "ready"
      ? labels.downloadReady
      : status === "error"
        ? labels.downloadError
        : labels.downloadHint;

  const buttonLabel =
    status === "working"
      ? labels.downloadWorking
      : status === "ready"
        ? labels.downloadReady
        : labels.downloadCta;

  return (
    <section
      aria-label={labels.downloadCta}
      data-slot="download-panel"
      className={cn(
        "rounded-2xl border border-border bg-surface px-5 py-5 shadow-sm",
        "sm:px-6 sm:py-6 flex flex-col gap-3 sm:flex-row sm:items-center",
        "sm:justify-between",
      )}
    >
      <p
        className="text-sm leading-6 text-muted-foreground"
        role="status"
        aria-live="polite"
        data-status={status}
      >
        {hint}
      </p>
      <Button
        type="button"
        variant="default"
        size="lg"
        onClick={handleDownload}
        disabled={disabled}
        aria-busy={status === "working"}
        aria-label={buttonLabel}
        data-state={status}
      >
        {status === "working" ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : status === "ready" ? (
          <CheckCircle2 aria-hidden="true" className="size-4" />
        ) : (
          <Download aria-hidden="true" className="size-4" />
        )}
        {buttonLabel}
      </Button>
    </section>
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

type MissingVariablesNoticeProps = {
  locale: AppLocale;
  missing: readonly MissingVariables[];
  labels: GenerateStepLabels;
};

function MissingVariablesNotice({
  locale,
  missing,
  labels,
}: MissingVariablesNoticeProps) {
  return (
    <Notice
      variant="warning"
      title={labels.missingTitle}
      className="text-sm"
    >
      <p className="leading-6">{labels.missingLede}</p>
      <ul
        data-slot="missing-variables-list"
        className="mt-2 flex flex-col gap-1"
      >
        {missing.map((entry) => (
          <li key={entry.skillId} className="leading-6">
            <strong className="font-medium text-foreground">
              {entry.name[locale]}
            </strong>
            <span className="text-muted-foreground">
              {" — "}
              {labels.missingVariableLabel}
              {": "}
            </span>
            <span className="font-mono text-[12.5px] text-foreground">
              {entry.variables.join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </Notice>
  );
}

type TargetPreviewProps = {
  targets: readonly TargetFilePlan[];
  activeTarget: TargetAgent | null;
  onSelect: (target: TargetAgent) => void;
  labels: GenerateStepLabels;
  previewContents?: PreviewContents;
};

function TargetPreview({
  targets,
  activeTarget,
  onSelect,
  labels,
  previewContents,
}: TargetPreviewProps) {
  const tabRefs = React.useRef<Map<TargetAgent, HTMLButtonElement | null>>(
    new Map(),
  );

  const registerTabRef = React.useCallback(
    (agent: TargetAgent) => (node: HTMLButtonElement | null) => {
      tabRefs.current.set(agent, node);
    },
    [],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, agent: TargetAgent) => {
      if (
        event.key !== "ArrowRight" &&
        event.key !== "ArrowLeft" &&
        event.key !== "Home" &&
        event.key !== "End"
      ) {
        return;
      }
      event.preventDefault();
      const order = targets.map((target) => target.target);
      if (order.length === 0) return;
      const currentIndex = order.indexOf(agent);
      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % order.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + order.length) % order.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = order.length - 1;
      }
      const nextAgent = order[nextIndex];
      onSelect(nextAgent);
      tabRefs.current.get(nextAgent)?.focus();
    },
    [targets, onSelect],
  );

  const activePlan = React.useMemo(
    () => targets.find((target) => target.target === activeTarget) ?? null,
    [targets, activeTarget],
  );

  const activeFile = activePlan?.files[0] ?? labels.previewFilePlaceholder;
  const renderedForTarget = activeTarget
    ? previewContents?.[activeTarget]
    : undefined;
  const renderedBody =
    renderedForTarget && activePlan?.files[0]
      ? renderedForTarget.get(activePlan.files[0])
      : undefined;
  const activeBody =
    renderedBody ?? (activeTarget ? SAMPLE_PREVIEW_BODIES[activeTarget] : "");
  const activeNote = activeTarget
    ? labels[TARGET_NOTE_KEY[activeTarget]]
    : labels.previewEmpty;

  return (
    <section
      aria-label={labels.targetPreviewHeading}
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-sm",
        "overflow-hidden",
      )}
      data-slot="target-preview"
    >
      <div className="border-b border-border px-5 pt-5 sm:px-6">
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-[0.18em] text-primary",
            "rtl:tracking-normal rtl:normal-case",
          )}
        >
          {labels.targetPreviewHeading}
        </p>
        <div
          role="tablist"
          aria-label={labels.targetPreviewHeading}
          className="mt-4 flex flex-wrap gap-1 border-b-0"
        >
          {targets.map((target) => {
            const isActive = target.target === activeTarget;
            const tabId = `target-tab-${target.target}`;
            const panelId = `target-panel-${target.target}`;
            return (
              <button
                key={target.target}
                ref={registerTabRef(target.target)}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelect(target.target)}
                onKeyDown={(event) => handleKeyDown(event, target.target)}
                className={cn(
                  "relative -mb-px rounded-t-md px-3 py-2 text-sm font-medium",
                  "border border-transparent border-b-0",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-primary focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-surface",
                  isActive
                    ? "bg-surface text-foreground border-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-state={isActive ? "active" : "inactive"}
              >
                {labels[TARGET_LABEL_KEY[target.target]]}
              </button>
            );
          })}
        </div>
      </div>
      {activeTarget ? (
        <div
          key={activeTarget}
          id={`target-panel-${activeTarget}`}
          role="tabpanel"
          aria-labelledby={`target-tab-${activeTarget}`}
          className="px-5 py-5 sm:px-6 sm:py-6"
        >
          <p className="text-sm leading-6 text-muted-foreground">
            {activeNote}
          </p>
          <div className="mt-3 flex items-center gap-2 font-mono text-xs text-soft-foreground">
            <FileText aria-hidden="true" className="size-3" />
            <span className="break-all">{activeFile}</span>
          </div>
          <pre
            className={cn(
              "mt-3 max-h-[460px] overflow-auto rounded-md border border-border",
              "bg-surface-sunken px-4 py-3 font-mono text-[12.5px] leading-6",
              "text-foreground",
            )}
            dir="ltr"
          >
            {activeBody}
          </pre>
        </div>
      ) : (
        <div className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
          {labels.previewEmpty}
        </div>
      )}
    </section>
  );
}
