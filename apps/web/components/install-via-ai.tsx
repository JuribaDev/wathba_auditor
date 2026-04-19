"use client";

import * as React from "react";
import {
  Bot,
  Check,
  ChevronDown,
  Clipboard,
  FileCode2,
  Sparkles,
  Terminal,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FilePlan } from "@/lib/generate/file-plan";
import {
  buildAgentPrompt,
  formatByteSize,
  type AgentPromptBundle,
  type AgentPromptLocale,
} from "@/lib/generate/prompt";
import type { SkillResolution } from "@/lib/generate/resolve-markdown";
import type { AppLocale } from "@/lib/i18n";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";
import { cn } from "@/lib/utils";

export type InstallViaAiLabels = {
  eyebrow: string;
  heading: string;
  lede: string;
  filesLabel: string;
  sizeLabel: string;
  copyCta: string;
  copyCopied: string;
  copyFallback: string;
  previewHeading: string;
  expand: string;
  collapse: string;
  fallbackNote: string;
  agentClaudeName: string;
  agentClaudeTagline: string;
  agentCursorName: string;
  agentCursorTagline: string;
  agentCodexName: string;
  agentCodexTagline: string;
  agentGenericName: string;
  agentGenericTagline: string;
};

type InstallViaAiProps = {
  locale: AppLocale;
  plan: FilePlan;
  activeSkills: readonly GeneratedSkill[];
  resolutions: readonly SkillResolution[];
  labels: InstallViaAiLabels;
};

const AGENT_ICON: Record<TargetAgent, LucideIcon> = {
  "claude-code": Sparkles,
  cursor: Wand2,
  codex: Terminal,
  "agents-md": Bot,
};

const NAME_KEY: Record<TargetAgent, keyof InstallViaAiLabels> = {
  "claude-code": "agentClaudeName",
  cursor: "agentCursorName",
  codex: "agentCodexName",
  "agents-md": "agentGenericName",
};

const TAGLINE_KEY: Record<TargetAgent, keyof InstallViaAiLabels> = {
  "claude-code": "agentClaudeTagline",
  cursor: "agentCursorTagline",
  codex: "agentCodexTagline",
  "agents-md": "agentGenericTagline",
};

export function InstallViaAi({
  locale,
  plan,
  activeSkills,
  resolutions,
  labels,
}: InstallViaAiProps) {
  const promptLocale: AgentPromptLocale = locale;

  const bundles = React.useMemo<AgentPromptBundle[]>(() => {
    if (plan.totalFiles === 0) return [];
    return plan.targets.map((target) =>
      buildAgentPrompt(target.target, activeSkills, resolutions, promptLocale),
    );
  }, [plan, activeSkills, resolutions, promptLocale]);

  const [expanded, setExpanded] = React.useState<TargetAgent | null>(null);

  if (bundles.length === 0) return null;

  return (
    <section
      aria-label={labels.heading}
      data-slot="install-via-ai"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm",
      )}
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
        data-slot="install-agent-list"
        className="mt-5 divide-y divide-border border-t border-border"
      >
        {bundles.map((bundle) => (
          <AgentCard
            key={bundle.target}
            bundle={bundle}
            expanded={expanded === bundle.target}
            onToggle={() =>
              setExpanded((current) =>
                current === bundle.target ? null : bundle.target,
              )
            }
            labels={labels}
          />
        ))}
      </ul>
      <footer className="border-t border-border bg-surface-variant/60 px-5 py-3 text-[12.5px] leading-6 text-muted-foreground sm:px-6">
        {labels.fallbackNote}
      </footer>
    </section>
  );
}

type AgentCardProps = {
  bundle: AgentPromptBundle;
  expanded: boolean;
  onToggle: () => void;
  labels: InstallViaAiLabels;
};

function AgentCard({ bundle, expanded, onToggle, labels }: AgentCardProps) {
  const Icon = AGENT_ICON[bundle.target];
  const name = labels[NAME_KEY[bundle.target]];
  const tagline = labels[TAGLINE_KEY[bundle.target]];
  const panelId = `install-panel-${bundle.target}`;
  const buttonId = `install-button-${bundle.target}`;
  const size = formatByteSize(bundle.byteSize);

  return (
    <li data-slot="install-agent-card" data-target={bundle.target}>
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center gap-4 px-5 py-4 text-left",
          "transition-colors hover:bg-surface-variant/60 sm:px-6",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-primary focus-visible:ring-offset-2",
          "focus-visible:ring-offset-surface",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
            "border border-primary-soft bg-primary-soft/30 text-primary",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline gap-2">
            <span className="font-heading text-base leading-tight text-foreground">
              {name}
            </span>
            <span
              className={cn(
                "hidden font-mono text-[11px] uppercase tracking-wider text-soft-foreground",
                "sm:inline rtl:tracking-normal",
              )}
            >
              {bundle.fileCount} {labels.filesLabel} · {size}
            </span>
          </span>
          <span className="mt-0.5 line-clamp-1 text-[13px] leading-5 text-muted-foreground">
            {tagline}
          </span>
        </span>
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
            "text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        >
          <ChevronDown className="size-4" />
        </span>
      </button>

      {expanded ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="space-y-4 border-t border-border bg-surface-sunken/40 px-5 py-5 sm:px-6"
        >
          <div className="flex flex-wrap items-center gap-2 sm:hidden">
            <span className="font-mono text-[11px] uppercase tracking-wider text-soft-foreground rtl:tracking-normal">
              {bundle.fileCount} {labels.filesLabel} · {size}
            </span>
          </div>

          <CopyButton bundle={bundle} labels={labels} />

          <div>
            <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-soft-foreground rtl:tracking-normal">
              <FileCode2 aria-hidden="true" className="size-3.5" />
              <span>{labels.previewHeading}</span>
            </div>
            <pre
              className={cn(
                "mt-2 max-h-[320px] overflow-auto rounded-md border border-border",
                "bg-surface px-4 py-3 font-mono text-[12px] leading-6 text-foreground",
              )}
              dir="ltr"
              data-slot="install-prompt-preview"
            >
              {bundle.text}
            </pre>
          </div>
        </div>
      ) : null}
    </li>
  );
}

type CopyButtonProps = {
  bundle: AgentPromptBundle;
  labels: InstallViaAiLabels;
};

function CopyButton({ bundle, labels }: CopyButtonProps) {
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
      textarea.value = bundle.text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    };

    let ok = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(bundle.text);
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
  }, [bundle.text]);

  const label =
    state === "copied"
      ? labels.copyCopied
      : state === "error"
        ? labels.copyFallback
        : labels.copyCta;

  return (
    <Button
      type="button"
      variant={state === "copied" ? "outline" : "default"}
      size="default"
      onClick={handleCopy}
      aria-live="polite"
      data-state={state}
      className="min-w-[180px]"
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
