import { ArrowRight, Download, FileText, Folder } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AppLocale } from "@/lib/i18n";
import type { GeneratedSkill } from "@/lib/skills/generated";
import {
  mapStatus,
  resolveCategoryLabelKey,
  statusLabelKey,
} from "@/lib/skills/labels";
import { resolveSkillSummary } from "@/lib/skills/summary";
import { cn } from "@/lib/utils";

type Translator = (key: string) => string;

type CommonProps = {
  lang: AppLocale;
};

type LandingProps = CommonProps & {
  tLanding: Translator;
};

type QuestionnaireProps = CommonProps & {
  tQuestionnaire: Translator;
};

type ReviewProps = CommonProps & {
  tQuestionnaire: Translator;
  tCompare: Translator;
  skills: GeneratedSkill[];
  categoryLabels: Record<string, string>;
  statusLabels: Record<string, string>;
};

type GenerateProps = CommonProps & {
  tQuestionnaire: Translator;
  tCompare: Translator;
  tree: Array<{ folder: string; items: string[] }>;
};

type DetailProps = CommonProps & {
  tCompare: Translator;
  tSkillDetail: Translator;
  skill: GeneratedSkill;
  categoryLabels: Record<string, string>;
  statusLabels: Record<string, string>;
};

function headingClass(lang: AppLocale, extra?: string) {
  return cn(
    "font-heading font-semibold leading-tight tracking-tight text-foreground",
    lang === "ar" ? "font-medium" : undefined,
    extra,
  );
}

export function CompareLandingScreen({ lang, tLanding }: LandingProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary rtl:tracking-normal rtl:normal-case">
        {tLanding("eyebrow")}
      </p>
      <h2 className={headingClass(lang, "text-[clamp(1.5rem,2.4vw,2rem)]")}>
        {tLanding("headline")}
      </h2>
      <p className="max-w-[48ch] text-sm leading-[1.65] text-muted-foreground">
        {tLanding("lede")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">
          {tLanding("primaryAction")}
          <ArrowRight data-icon="inline-end" />
        </Button>
        <Button size="sm" variant="ghost">
          {tLanding("secondaryAction")}
        </Button>
      </div>
      <figure
        aria-label={tLanding("samplePreviewLabel")}
        className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <FileText aria-hidden="true" className="size-3" />
            <span className="font-mono">{tLanding("sampleFilename")}</span>
          </span>
          <StatusBadge status="reviewed">
            {tLanding("sampleHeaderBadge")}
          </StatusBadge>
        </div>
        <pre
          dir="ltr"
          className="max-h-[180px] overflow-hidden whitespace-pre-wrap rounded-lg border border-border bg-surface-sunken p-3 text-left font-mono text-[11px] leading-[1.6] text-foreground"
        >{`---
name: zatca-phase2
version: 0.4.2
status: reviewed
---
# ZATCA Phase 2
> Engineering guidance, not legal advice.
## Non-negotiables
- B2B cleared before delivery
- B2C reported within 24 hours
`}</pre>
      </figure>
    </div>
  );
}

export function CompareQuestionnaireScreen({
  lang,
  tQuestionnaire,
}: QuestionnaireProps) {
  const optionKeys = ["ksa", "gcc", "global"] as const;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary rtl:tracking-normal rtl:normal-case">
        {tQuestionnaire("eyebrowOf").replace("{step}", "1").replace("{total}", "4")}
      </p>
      <h2 className={headingClass(lang, "text-2xl")}>
        {tQuestionnaire("stepAbout")}
      </h2>
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-foreground">
          {tQuestionnaire("about.market.title")}
        </p>
        <p className="text-sm text-muted-foreground">
          {tQuestionnaire("about.market.desc")}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {optionKeys.map((key, index) => {
          const selected = index === 0;
          return (
            <div
              key={key}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border p-3 text-start transition-colors",
                selected
                  ? "border-primary bg-primary/5 shadow-[var(--shadow-sm)]"
                  : "border-border bg-surface",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">
                  {tQuestionnaire(`about.market.options.${key}.label`)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-4 place-items-center rounded-full border",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  <span
                    className={cn(
                      "block size-1.5 rounded-full",
                      selected ? "bg-primary-foreground" : "bg-transparent",
                    )}
                  />
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {tQuestionnaire(`about.market.options.${key}.desc`)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CompareReviewScreen({
  lang,
  tQuestionnaire,
  tCompare,
  skills,
  categoryLabels,
  statusLabels,
}: ReviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary rtl:tracking-normal rtl:normal-case">
        {tQuestionnaire("eyebrowOf").replace("{step}", "3").replace("{total}", "4")}
      </p>
      <h2 className={headingClass(lang, "text-2xl")}>
        {tQuestionnaire("reviewHeading")}
      </h2>
      <p className="max-w-[56ch] text-sm leading-[1.65] text-muted-foreground">
        {tQuestionnaire("reviewLede")}
      </p>
      <ul className="flex flex-col gap-2">
        {skills.map((skill) => {
          const status = mapStatus(skill.status);
          const statusLabel = statusLabels[statusLabelKey(status)];
          const categoryLabel = categoryLabels[resolveCategoryLabelKey(skill)];
          const summary = resolveSkillSummary(skill, lang);
          return (
            <li
              key={skill.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  aria-hidden="true"
                  className="grid size-4 place-items-center rounded-sm border border-primary bg-primary text-primary-foreground"
                >
                  <span className="block size-1.5 rotate-45 border-b-2 border-s-2 border-primary-foreground" />
                </span>
                <Badge variant="secondary" className="rounded-full text-[10px]">
                  {categoryLabel}
                </Badge>
                <StatusBadge status={status}>{statusLabel}</StatusBadge>
                <Badge
                  variant="outline"
                  className="rounded-full text-[10px] font-medium uppercase tracking-wide text-primary"
                >
                  {tCompare("reviewRecommendedLabel")}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {skill.name[lang]}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-[1.55] text-muted-foreground">
                {summary}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-soft-foreground">
                <span className="font-mono">v{skill.version}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{skill.lastVerified}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CompareGenerateScreen({
  lang,
  tQuestionnaire,
  tCompare,
  tree,
}: GenerateProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary rtl:tracking-normal rtl:normal-case">
        {tQuestionnaire("eyebrowOf").replace("{step}", "4").replace("{total}", "4")}
      </p>
      <h2 className={headingClass(lang, "text-2xl")}>
        {tQuestionnaire("generateHeading")}
      </h2>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground rtl:tracking-normal rtl:normal-case">
          {tQuestionnaire("generate.zipLabel")}
        </p>
        <div
          dir="ltr"
          className="flex flex-col gap-0.5 text-left font-mono text-xs leading-[1.9]"
        >
          <span className="flex items-center gap-1.5 text-primary">
            <Folder aria-hidden="true" className="size-3" />
            {tCompare("generateZipFilename")}
          </span>
          {tree.map((group) => (
            <div key={group.folder} className="flex flex-col gap-0.5">
              <span className="ps-3 text-primary">{group.folder}</span>
              {group.items.map((item) => (
                <span
                  key={`${group.folder}-${item}`}
                  className="ps-6 text-muted-foreground"
                >
                  — {item}
                </span>
              ))}
            </div>
          ))}
        </div>
        <Button size="sm" className="mt-4 w-full justify-center">
          <Download data-icon="inline-start" />
          {tCompare("generateDownloadLabel")}
        </Button>
      </div>
    </div>
  );
}

export function CompareDetailScreen({
  lang,
  tCompare,
  tSkillDetail,
  skill,
  categoryLabels,
  statusLabels,
}: DetailProps) {
  const status = mapStatus(skill.status);
  const statusLabel = statusLabels[statusLabelKey(status)];
  const categoryLabel = categoryLabels[resolveCategoryLabelKey(skill)];
  const summary = resolveSkillSummary(skill, lang);
  return (
    <div className="flex flex-col gap-4">
      <Button size="sm" variant="ghost" className="self-start px-2 text-xs">
        <ArrowRight
          data-icon="inline-start"
          className="rtl:-scale-x-100"
          aria-hidden="true"
        />
        {tCompare("detailBackLabel")}
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full">
          {categoryLabel}
        </Badge>
        <StatusBadge status={status}>{statusLabel}</StatusBadge>
        <Badge variant="outline" className="rounded-full font-mono text-xs">
          v{skill.version}
        </Badge>
      </div>
      <h2 className={headingClass(lang, "text-[clamp(1.5rem,2.4vw,1.9rem)]")}>
        {skill.name[lang]}
      </h2>
      <p className="max-w-[56ch] text-sm leading-[1.65] text-muted-foreground">
        {summary}
      </p>
      {skill.disclaimer ? (
        <Notice variant="warning" title={tSkillDetail("disclaimerTitle")}>
          {tSkillDetail("disclaimerBody")}
        </Notice>
      ) : null}
    </div>
  );
}
