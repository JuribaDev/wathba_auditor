"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Sparkles,
  Terminal,
  FolderGit2,
  MousePointerClick,
  Archive,
} from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import type { TargetAgent } from "@/lib/skills/recommendations";
import { cn } from "@/lib/utils";

// InstallChannels — primary install UX.
//
// Replaces the prompt-copy / download-zip flow as the top of the generate step.
// Ordering is intentional and locked by product:
//   1. Claude Code Marketplace (primary, recommended) — always shown; the
//      plugin install is target-agnostic and includes every skill in the
//      canonical library regardless of the questionnaire's target selection.
//   2. Claude Code Local Plugin — always shown; same reasoning as marketplace.
//   3. Cursor — shown iff the user selected the `cursor` target (otherwise the
//      downloaded zip ships no `.cursor/**` files and this copy would lie).
//   4. Codex — shown iff the user selected the `codex` target.
//   5. Manual Zip / Offline — shown iff the user has any target selected at all
//      AND manual copy is derived dynamically from those targets so we never
//      promise extract paths that aren't in the archive.

export type InstallChannelsLabels = {
  heading: string;
  lede: string;
  recommendedBadge: string;
  showStepsLabel: string;
  hideStepsLabel: string;
  copyLabel: string;
  copiedLabel: string;
  copyFallback: string;
};

type ChannelId =
  | "marketplace"
  | "local-plugin"
  | "cursor"
  | "codex"
  | "manual";

type StaticChannel = {
  id: ChannelId;
  name: { en: string; ar: string };
  tagline: { en: string; ar: string };
  steps: { en: string[]; ar: string[] };
  commands?: string[];
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  accent: "primary" | "neutral";
};

const STATIC_CHANNELS: Record<
  Exclude<ChannelId, "manual">,
  StaticChannel
> = {
  marketplace: {
    id: "marketplace",
    name: { en: "Claude Code Marketplace", ar: "سوق Claude Code" },
    tagline: {
      en: "One-line install from the Wathba marketplace. Installs every skill and five workflow commands — target-agnostic, independent of what you pick below.",
      ar: "تثبيت بسطر واحد من سوق وثبة. يضيف جميع المهارات وخمسة أوامر عمل — مستقل عن اختيارات الهدف أدناه.",
    },
    steps: {
      en: [
        "Open Claude Code in any project.",
        "Run the commands on the right — the first adds the marketplace, the second installs the wathba-skills plugin.",
        "Type /wathba-compliance-review (or any /wathba-* command) to confirm the install.",
      ],
      ar: [
        "افتح Claude Code في أي مشروع.",
        "شغّل الأوامر على اليسار — الأول يضيف السوق، والثاني يُثبّت إضافة wathba-skills.",
        "اكتب /wathba-compliance-review (أو أي أمر /wathba-*) للتأكد من التثبيت.",
      ],
    },
    commands: [
      "/plugin marketplace add JuribaDev/wathba_auditor",
      "/plugin install wathba-skills@wathba",
    ],
    icon: Sparkles,
    accent: "primary",
  },
  "local-plugin": {
    id: "local-plugin",
    name: { en: "Claude Code Local Plugin", ar: "إضافة Claude Code محلية" },
    tagline: {
      en: "Clone the repo and develop the plugin locally. Ideal for contributors and air-gapped environments. Target-agnostic; installs every skill.",
      ar: "استنسخ المستودع وطوّر الإضافة محلياً. مناسب للمساهمين والبيئات المعزولة. مستقل عن الأهداف المختارة.",
    },
    steps: {
      en: [
        "Clone JuribaDev/wathba_auditor.",
        "Install dependencies with pnpm install.",
        "Regenerate the plugin dist with pnpm generate:plugin-dist.",
        "Point Claude Code at the local marketplace and install the plugin.",
      ],
      ar: [
        "استنسخ JuribaDev/wathba_auditor.",
        "ثبّت الاعتماديات عبر pnpm install.",
        "أعِد توليد الإضافة عبر pnpm generate:plugin-dist.",
        "وجّه Claude Code إلى السوق المحلي وثبّت الإضافة.",
      ],
    },
    commands: [
      "pnpm install && pnpm generate:plugin-dist",
      "/plugin marketplace add ./",
      "/plugin install wathba-skills@wathba",
    ],
    icon: FolderGit2,
    accent: "neutral",
  },
  cursor: {
    id: "cursor",
    name: { en: "Cursor", ar: "Cursor" },
    tagline: {
      en: "Durable .cursor/rules/*.mdc context plus .cursor/skills/ interop. Download the zip below, then copy into your repo.",
      ar: "سياق دائم عبر .cursor/rules/*.mdc مع توافق .cursor/skills/. نزّل الحزمة أدناه وانسخها إلى مستودعك.",
    },
    steps: {
      en: [
        "Use the Advanced → Download zip below.",
        "Extract into your repo root — the archive ships .cursor/rules/<slug>.mdc alongside .cursor/skills/<slug>/SKILL.md for every skill you picked.",
        "Restart Cursor. Each rule auto-attaches via its frontmatter; SKILL.md files provide Agent Skills interop.",
      ],
      ar: [
        "استخدم قسم المتقدم أدناه لتنزيل حزمة zip.",
        "فك الضغط في جذر المستودع — يحوي الأرشيف .cursor/rules/<slug>.mdc إلى جانب .cursor/skills/<slug>/SKILL.md لكل مهارة اخترتها.",
        "أعد تشغيل Cursor. تُربط كل قاعدة تلقائياً عبر frontmatter، وتوفر ملفات SKILL.md توافقاً مع Agent Skills.",
      ],
    },
    icon: MousePointerClick,
    accent: "neutral",
  },
  codex: {
    id: "codex",
    name: { en: "Codex", ar: "Codex" },
    tagline: {
      en: "Native .agents/skills/<slug>/. Codex auto-discovers every skill — no manifest step.",
      ar: "يدعم .agents/skills/<slug>/ أصلياً. يكتشف Codex كل مهارة تلقائياً — دون خطوات إضافية.",
    },
    steps: {
      en: [
        "Use the Advanced → Download zip below.",
        "Extract .agents/skills/ into your repo root.",
        "Start a Codex session; the skills appear in its available-skills list immediately.",
      ],
      ar: [
        "استخدم قسم المتقدم أدناه لتنزيل حزمة zip.",
        "فك .agents/skills/ في جذر المستودع.",
        "ابدأ جلسة Codex؛ تظهر المهارات فوراً في قائمة المهارات المتاحة.",
      ],
    },
    icon: Terminal,
    accent: "neutral",
  },
};

// Per-target archive-root labels (what actually lands on disk). Used both by
// visibility gating and by the manual card's dynamic copy.
const ARCHIVE_PATHS: Record<TargetAgent, { en: string; ar: string }> = {
  "claude-code": { en: ".claude/skills/", ar: ".claude/skills/" },
  cursor: { en: ".cursor/rules/ + .cursor/skills/", ar: ".cursor/rules/ + .cursor/skills/" },
  codex: { en: ".agents/skills/", ar: ".agents/skills/" },
  "agents-md": { en: "AGENTS.md", ar: "AGENTS.md" },
};

function formatList(items: string[], locale: AppLocale): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  const sep = locale === "ar" ? "، " : ", ";
  const last = items[items.length - 1];
  const andWord = locale === "ar" ? " و" : ", and ";
  return items.slice(0, -1).join(sep) + andWord + last;
}

function buildManualChannel(
  selectedTargets: readonly TargetAgent[],
  locale: AppLocale,
): StaticChannel | null {
  if (selectedTargets.length === 0) return null;
  const paths = selectedTargets.map((t) => ARCHIVE_PATHS[t][locale]);
  const list = formatList(paths, locale);
  return {
    id: "manual",
    name: { en: "Manual Zip / Offline", ar: "حزمة يدوية / دون اتصال" },
    tagline: {
      en: `Single archive with exactly what you selected: ${list}. Use when no package manager or marketplace is available.`,
      ar: `أرشيف واحد يحوي ما اخترته تحديداً: ${list}. استخدمه حين لا يتوفر مدير حزم أو سوق.`,
    },
    steps: {
      en: [
        "Use the Advanced → Download zip below.",
        `Your selection ships: ${list}.`,
        "Drop the directories your stack needs into your repo. Zip contents change with your target selection above.",
      ],
      ar: [
        "استخدم قسم المتقدم أدناه لتنزيل حزمة zip.",
        `اختيارك يتضمن: ${list}.`,
        "انسخ المجلدات التي تحتاجها إلى مستودعك. يتغير محتوى الحزمة حسب اختياراتك للأهداف أعلاه.",
      ],
    },
    icon: Archive,
    accent: "neutral",
  };
}

type InstallChannelsProps = {
  locale: AppLocale;
  labels: InstallChannelsLabels;
  selectedTargets: readonly TargetAgent[];
};

export function InstallChannels({
  locale,
  labels,
  selectedTargets,
}: InstallChannelsProps) {
  const visible: StaticChannel[] = [];
  visible.push(STATIC_CHANNELS.marketplace);
  visible.push(STATIC_CHANNELS["local-plugin"]);
  if (selectedTargets.includes("cursor")) visible.push(STATIC_CHANNELS.cursor);
  if (selectedTargets.includes("codex")) visible.push(STATIC_CHANNELS.codex);
  const manual = buildManualChannel(selectedTargets, locale);
  if (manual) visible.push(manual);

  return (
    <section
      aria-label={labels.heading}
      data-slot="install-channels"
      className={cn(
        "rounded-2xl border border-border bg-surface px-5 py-5 shadow-sm",
        "sm:px-6 sm:py-6",
      )}
    >
      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-[0.18em] text-primary",
            "rtl:tracking-normal rtl:normal-case",
          )}
        >
          {labels.heading}
        </p>
        <p className="text-sm leading-6 text-muted-foreground">{labels.lede}</p>
      </header>
      <ol className="mt-5 flex flex-col gap-3" data-slot="install-channel-list">
        {visible.map((channel, index) => (
          <li key={channel.id}>
            <ChannelCard
              index={index + 1}
              channel={channel}
              locale={locale}
              labels={labels}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

type ChannelCardProps = {
  index: number;
  channel: StaticChannel;
  locale: AppLocale;
  labels: InstallChannelsLabels;
};

function ChannelCard({ index, channel, locale, labels }: ChannelCardProps) {
  const [open, setOpen] = React.useState(channel.id === "marketplace");
  const Icon = channel.icon;
  const steps = channel.steps[locale];
  const isPrimary = channel.accent === "primary";

  return (
    <article
      data-slot="install-channel-card"
      data-channel={channel.id}
      data-primary={isPrimary ? "true" : "false"}
      className={cn(
        "group rounded-xl border bg-surface-variant/40 transition-colors",
        isPrimary
          ? "border-primary/40 bg-primary/[0.04] shadow-[0_0_0_1px_rgba(0,0,0,0.02)]"
          : "border-border hover:border-primary/30",
      )}
    >
      <div className="flex items-start gap-3 px-4 py-4 sm:px-5 sm:py-5">
        <div
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            isPrimary
              ? "bg-primary/10 text-primary"
              : "bg-surface text-muted-foreground",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "font-mono text-[11px] tabular-nums",
                isPrimary ? "text-primary" : "text-soft-foreground",
              )}
            >
              {String(index).padStart(2, "0")}
            </span>
            <h3 className="font-heading text-[15px] leading-tight text-foreground">
              {channel.name[locale]}
            </h3>
            {isPrimary ? (
              <span
                className={cn(
                  "rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5",
                  "text-[10px] font-medium uppercase tracking-wider text-primary",
                  "rtl:tracking-normal rtl:normal-case",
                )}
              >
                {labels.recommendedBadge}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[13.5px] leading-6 text-muted-foreground">
            {channel.tagline[locale]}
          </p>
          {channel.commands && channel.commands.length > 0 ? (
            <div className="mt-3 flex flex-col gap-1.5">
              {channel.commands.map((cmd) => (
                <CommandRow key={cmd} command={cmd} labels={labels} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between gap-2 border-t border-border/70",
          "px-4 py-2.5 text-[12.5px] text-muted-foreground sm:px-5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          "hover:text-foreground",
        )}
      >
        <span>{open ? labels.hideStepsLabel : labels.showStepsLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>
      {open ? (
        <ol
          data-slot="install-channel-steps"
          className={cn(
            "border-t border-border/70 px-5 pb-4 pt-3 sm:px-6",
            "text-[13.5px] leading-6 text-muted-foreground",
            "list-inside list-decimal space-y-1.5",
          )}
        >
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}

type CommandRowProps = {
  command: string;
  labels: InstallChannelsLabels;
};

function CommandRow({ command, labels }: CommandRowProps) {
  const [copied, setCopied] = React.useState(false);
  const [fallback, setFallback] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard?.writeText
    ) {
      setFallback(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setFallback(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFallback(true);
    }
  }, [command]);

  return (
    <div
      data-slot="install-channel-command"
      className={cn(
        "group/cmd flex items-center gap-2 rounded-md border border-border bg-surface-sunken",
        "px-3 py-2 font-mono text-[12.5px] text-foreground",
      )}
      dir="ltr"
    >
      <code className="min-w-0 flex-1 truncate">{command}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={labels.copyLabel}
        aria-live="polite"
        className={cn(
          "flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[11.5px]",
          "text-muted-foreground hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "focus-visible:ring-offset-1 focus-visible:ring-offset-surface-sunken",
        )}
      >
        {copied ? (
          <>
            <Check aria-hidden="true" className="size-3" />
            <span className="sr-only sm:not-sr-only">{labels.copiedLabel}</span>
          </>
        ) : (
          <>
            <Copy aria-hidden="true" className="size-3" />
            <span className="sr-only sm:not-sr-only">{labels.copyLabel}</span>
          </>
        )}
      </button>
      {fallback ? (
        <span className="sr-only" role="status">
          {labels.copyFallback}
        </span>
      ) : null}
    </div>
  );
}
