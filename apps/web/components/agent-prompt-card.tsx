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
import type { TargetAgent } from "@/lib/skills/recommendations";
import { cn } from "@/lib/utils";

export type AgentPromptCardBundle = {
  target: TargetAgent;
  text: string;
  byteSize: number;
};

export type AgentPromptCardMeta = {
  primary: string;
  secondary?: string;
};

export type AgentPromptCardLabels = {
  copyCta: string;
  copyCopied: string;
  copyFallback: string;
  previewHeading: string;
};

export type AgentPromptNameTagline = {
  name: string;
  tagline: string;
};

type AgentPromptCardProps = {
  bundle: AgentPromptCardBundle;
  expanded: boolean;
  onToggle: () => void;
  agent: AgentPromptNameTagline;
  meta: AgentPromptCardMeta;
  labels: AgentPromptCardLabels;
  testSlot?: string;
};

const AGENT_ICON: Record<TargetAgent, LucideIcon> = {
  "claude-code": Sparkles,
  cursor: Wand2,
  codex: Terminal,
  "agents-md": Bot,
};

export function AgentPromptCard({
  bundle,
  expanded,
  onToggle,
  agent,
  meta,
  labels,
  testSlot = "install",
}: AgentPromptCardProps) {
  const Icon = AGENT_ICON[bundle.target];
  const panelId = `${testSlot}-panel-${bundle.target}`;
  const buttonId = `${testSlot}-button-${bundle.target}`;

  return (
    <li data-slot={`${testSlot}-agent-card`} data-target={bundle.target}>
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={cn(
          "flex w-full min-w-0 items-center gap-4 px-4 py-4 text-left",
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
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-heading text-base leading-tight text-foreground">
              {agent.name}
            </span>
            <span
              className={cn(
                "hidden font-mono text-[11px] uppercase tracking-wider text-soft-foreground",
                "sm:inline rtl:tracking-normal",
              )}
            >
              {meta.primary}
              {meta.secondary ? ` · ${meta.secondary}` : null}
            </span>
          </span>
          <span className="mt-0.5 line-clamp-1 text-[13px] leading-5 text-muted-foreground">
            {agent.tagline}
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
          className="min-w-0 space-y-4 border-t border-border bg-surface-sunken/40 px-4 py-4 sm:px-6"
        >
          <div className="flex flex-wrap items-center gap-2 sm:hidden">
            <span className="font-mono text-[11px] uppercase tracking-wider text-soft-foreground rtl:tracking-normal">
              {meta.primary}
              {meta.secondary ? ` · ${meta.secondary}` : null}
            </span>
          </div>

          <PromptCopyButton bundle={bundle} labels={labels} />

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-soft-foreground rtl:tracking-normal">
              <FileCode2 aria-hidden="true" className="size-3.5" />
              <span>{labels.previewHeading}</span>
            </div>
            <pre
              className={cn(
                "mt-2 max-h-[320px] w-full max-w-full min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border",
                "bg-surface px-4 py-3 font-mono text-[12px] leading-6 text-foreground",
              )}
              dir="ltr"
              data-slot={`${testSlot}-prompt-preview`}
            >
              {bundle.text}
            </pre>
          </div>
        </div>
      ) : null}
    </li>
  );
}

type PromptCopyButtonProps = {
  bundle: AgentPromptCardBundle;
  labels: AgentPromptCardLabels;
};

export function PromptCopyButton({ bundle, labels }: PromptCopyButtonProps) {
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
