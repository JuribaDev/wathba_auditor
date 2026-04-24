"use client";

import * as React from "react";
import { Check, Clipboard, FileCode2, GitBranch, ShieldCheck } from "lucide-react";

import {
  AgentPromptCard,
  type AgentPromptCardLabels,
} from "@/components/agent-prompt-card";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { RadioCardGroup, type RadioCardOption } from "@/components/ui/radio-card";
import {
  buildMigrationPrompt,
  buildMigratorInstallPrompts,
  describeMigratorPromptSize,
  type MigrationTargetAgent,
} from "@/lib/migrate/prompt";
import type { TargetAgent } from "@/lib/skills/recommendations";
import { cn } from "@/lib/utils";

export type MigratorLabels = {
  sourceHeading: string;
  sourceLede: string;
  sourceClaudeLabel: string;
  sourceClaudeDesc: string;
  targetHeading: string;
  targetLede: string;
  targetClaudeLabel: string;
  targetClaudeDesc: string;
  targetCursorLabel: string;
  targetCursorDesc: string;
  targetCodexLabel: string;
  targetCodexDesc: string;
  targetGenericLabel: string;
  targetGenericDesc: string;
  targetCustomLabel: string;
  targetCustomDesc: string;
  approvalTitle: string;
  approvalBody: string;
  promptHeading: string;
  promptLede: string;
  promptMeta: string;
  copyCta: string;
  copyCopied: string;
  copyFallback: string;
  previewHeading: string;
  installerHeading: string;
  installerLede: string;
  installerFooter: string;
  installClaudeName: string;
  installClaudeTagline: string;
  installCursorName: string;
  installCursorTagline: string;
  installCodexName: string;
  installCodexTagline: string;
  filesLabel: string;
  sizeLabel: string;
};

const TARGET_OPTIONS: readonly MigrationTargetAgent[] = [
  "codex",
  "cursor",
  "claude-code",
  "agents-md",
  "custom",
];

const INSTALL_NAME_KEY: Record<TargetAgent, keyof MigratorLabels> = {
  "claude-code": "installClaudeName",
  cursor: "installCursorName",
  codex: "installCodexName",
  "agents-md": "installClaudeName",
};

const INSTALL_TAGLINE_KEY: Record<TargetAgent, keyof MigratorLabels> = {
  "claude-code": "installClaudeTagline",
  cursor: "installCursorTagline",
  codex: "installCodexTagline",
  "agents-md": "installClaudeTagline",
};

export function MigratorShell({ labels }: { labels: MigratorLabels }) {
  const [target, setTarget] = React.useState<MigrationTargetAgent>("codex");
  const [expandedInstall, setExpandedInstall] =
    React.useState<TargetAgent | null>("codex");

  const migrationPrompt = React.useMemo(
    () => buildMigrationPrompt({ source: "claude-code", target }),
    [target],
  );
  const promptSize = React.useMemo(
    () => describeMigratorPromptSize(migrationPrompt),
    [migrationPrompt],
  );
  const installPrompts = React.useMemo(
    () => buildMigratorInstallPrompts({ source: "claude-code", target }),
    [target],
  );

  const targetOptions = React.useMemo<RadioCardOption[]>(
    () =>
      TARGET_OPTIONS.map((value) => ({
        value,
        label: labels[targetLabelKey(value)],
        description: labels[targetDescriptionKey(value)],
      })),
    [labels],
  );

  const cardLabels: AgentPromptCardLabels = React.useMemo(
    () => ({
      copyCta: labels.copyCta,
      copyCopied: labels.copyCopied,
      copyFallback: labels.copyFallback,
      previewHeading: labels.previewHeading,
    }),
    [labels],
  );

  return (
    <div
      data-slot="migrator-shell"
      className={cn(
        "mx-auto grid w-full max-w-[1160px] min-w-0 gap-5 pb-12",
        "lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]",
      )}
    >
      <section className="grid min-w-0 content-start gap-4">
        <Panel>
          <SectionHeader heading={labels.sourceHeading} lede={labels.sourceLede} />
          <RadioCardGroup
            value="claude-code"
            onValueChange={() => {}}
            options={[
              {
                value: "claude-code",
                label: labels.sourceClaudeLabel,
                description: labels.sourceClaudeDesc,
              },
            ]}
            name="migration-source"
            aria-label={labels.sourceHeading}
          />
        </Panel>

        <Panel>
          <SectionHeader heading={labels.targetHeading} lede={labels.targetLede} />
          <RadioCardGroup
            value={target}
            onValueChange={(value) => setTarget(value as MigrationTargetAgent)}
            options={targetOptions}
            name="migration-target"
            aria-label={labels.targetHeading}
          />
        </Panel>

        <Notice variant="info" title={labels.approvalTitle}>
          {labels.approvalBody}
        </Notice>
      </section>

      <section className="grid min-w-0 content-start gap-4">
        <Panel>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader heading={labels.promptHeading} lede={labels.promptLede} />
              <div className="flex shrink-0 items-center gap-2 text-[12px] text-muted-foreground">
                <FileCode2 aria-hidden="true" className="size-3.5" />
                <span>
                  {labels.promptMeta
                    .replace("{size}", promptSize)
                    .replace("{target}", labels[targetLabelKey(target)])}
                </span>
              </div>
            </div>
            <PromptCopyButton text={migrationPrompt} labels={labels} />
            <PromptPreview heading={labels.previewHeading} text={migrationPrompt} />
          </div>
        </Panel>

        <section
          aria-label={labels.installerHeading}
          className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface"
        >
          <header className="grid gap-2 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
              <h2 className="font-heading text-lg leading-snug">
                {labels.installerHeading}
              </h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {labels.installerLede}
            </p>
          </header>
          <ul role="list" className="divide-y divide-border border-t border-border">
            {installPrompts.map((bundle) => (
              <AgentPromptCard
                key={bundle.target}
                bundle={bundle}
                expanded={expandedInstall === bundle.target}
                onToggle={() =>
                  setExpandedInstall((current) =>
                    current === bundle.target ? null : bundle.target,
                  )
                }
                agent={{
                  name: labels[INSTALL_NAME_KEY[bundle.target]],
                  tagline: labels[INSTALL_TAGLINE_KEY[bundle.target]],
                }}
                meta={{
                  primary: `${bundle.fileCount} ${labels.filesLabel}`,
                  secondary: `${describeMigratorPromptSize(bundle.text)} ${labels.sizeLabel}`,
                }}
                labels={cardLabels}
                testSlot="migrator-install"
              />
            ))}
          </ul>
          <footer className="border-t border-border bg-surface-variant/60 px-4 py-3 text-[12.5px] leading-6 text-muted-foreground sm:px-5">
            {labels.installerFooter}
          </footer>
        </section>
      </section>
    </div>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-sm)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  heading,
  lede,
}: {
  heading: string;
  lede: string;
}) {
  return (
    <div className="mb-4 grid gap-2">
      <h2 className="font-heading text-lg leading-snug">{heading}</h2>
      <p className="text-sm leading-6 text-muted-foreground">{lede}</p>
    </div>
  );
}

function PromptPreview({ heading, text }: { heading: string; text: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-[12px] font-medium text-soft-foreground">
        <GitBranch aria-hidden="true" className="size-3.5" />
        <span>{heading}</span>
      </div>
      <pre
        dir="ltr"
        data-slot="migration-prompt-preview"
        className={cn(
          "mt-2 max-h-[520px] w-full max-w-full min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border",
          "bg-surface-sunken px-4 py-3 font-mono text-[12px] leading-6 text-foreground",
        )}
      >
        {text}
      </pre>
    </div>
  );
}

function PromptCopyButton({
  text,
  labels,
}: {
  text: string;
  labels: Pick<MigratorLabels, "copyCta" | "copyCopied" | "copyFallback">;
}) {
  const [state, setState] = React.useState<"idle" | "copied" | "error">("idle");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = React.useCallback(async () => {
    const fallback = () => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand("copy");
      } catch {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    };

    let ok = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        ok = fallback();
      }
    } else {
      ok = fallback();
    }

    setState(ok ? "copied" : "error");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState("idle"), 2200);
  }, [text]);

  const label =
    state === "copied"
      ? labels.copyCopied
      : state === "error"
        ? labels.copyFallback
        : labels.copyCta;

  return (
    <Button
      type="button"
      onClick={handleCopy}
      variant={state === "copied" ? "outline" : "default"}
      data-state={state}
      className="w-fit min-w-[180px]"
    >
      {state === "copied" ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Clipboard aria-hidden="true" className="size-4" />
      )}
      {label}
    </Button>
  );
}

function targetLabelKey(target: MigrationTargetAgent): keyof MigratorLabels {
  switch (target) {
    case "claude-code":
      return "targetClaudeLabel";
    case "cursor":
      return "targetCursorLabel";
    case "codex":
      return "targetCodexLabel";
    case "agents-md":
      return "targetGenericLabel";
    case "custom":
      return "targetCustomLabel";
  }
}

function targetDescriptionKey(target: MigrationTargetAgent): keyof MigratorLabels {
  switch (target) {
    case "claude-code":
      return "targetClaudeDesc";
    case "cursor":
      return "targetCursorDesc";
    case "codex":
      return "targetCodexDesc";
    case "agents-md":
      return "targetGenericDesc";
    case "custom":
      return "targetCustomDesc";
  }
}
