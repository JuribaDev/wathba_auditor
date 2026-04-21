import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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

export type SkillMiniCardLabels = {
  category: Record<
    "categorySaudi" | "categoryCompliance" | "categorySecurity" | "categoryArchitecture",
    string
  >;
  status: Record<"statusReviewed" | "statusCommunity" | "statusDraft", string>;
  disclaimer: string;
  disclaimerTitle: string;
  versionPrefix: string;
  verifiedPrefix: string;
  viewSkill: string;
  lifecycleDeprecated: string;
  lifecycleArchived: string;
  lifecycleDeprecatedShort: string;
  lifecycleArchivedShort: string;
};

type SkillMiniCardProps = {
  locale: AppLocale;
  skill: GeneratedSkill;
  href: string;
  labels: SkillMiniCardLabels;
  className?: string;
};

export function SkillMiniCard({
  locale,
  skill,
  href,
  labels,
  className,
}: SkillMiniCardProps) {
  const summary = resolveSkillSummary(skill, locale);
  const categoryLabel = labels.category[resolveCategoryLabelKey(skill)];
  const status = mapStatus(skill.status);
  const statusLabel = labels.status[statusLabelKey(status)];
  const title = skill.name[locale];

  const isDeprecated = skill.lifecycle === "deprecated";
  const isArchived = skill.lifecycle === "archived";
  const lifecycleHint = isArchived
    ? labels.lifecycleArchivedShort
    : isDeprecated
      ? labels.lifecycleDeprecatedShort
      : null;

  return (
    <Link
      href={href}
      aria-label={`${labels.viewSkill}: ${title}`}
      data-lifecycle={skill.lifecycle}
      className={cn(
        "group flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-6 text-start no-underline shadow-[var(--shadow-sm)] transition-all duration-150",
        "hover:-translate-y-[1px] hover:border-border-strong hover:shadow-[var(--shadow-md)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDeprecated && "opacity-85 [&_h3]:line-through decoration-muted-foreground/40",
        isArchived && "opacity-70 border-dashed",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] rtl:tracking-normal rtl:normal-case"
          >
            {categoryLabel}
          </Badge>
          <StatusBadge status={status}>{statusLabel}</StatusBadge>
          {isDeprecated ? (
            <Badge
              variant="outline"
              className="rounded-full border-warning/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] text-warning rtl:tracking-normal rtl:normal-case"
              data-slot="lifecycle-badge"
              data-lifecycle="deprecated"
            >
              {labels.lifecycleDeprecated}
            </Badge>
          ) : null}
          {isArchived ? (
            <Badge
              variant="outline"
              className="rounded-full border-muted-foreground/40 px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground rtl:tracking-normal rtl:normal-case"
              data-slot="lifecycle-badge"
              data-lifecycle="archived"
            >
              {labels.lifecycleArchived}
            </Badge>
          ) : null}
          {skill.disclaimer ? (
            <Badge
              variant="outline"
              className="rounded-full border-warning/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] text-warning rtl:tracking-normal rtl:normal-case"
              title={labels.disclaimerTitle}
              aria-label={labels.disclaimerTitle}
            >
              {labels.disclaimer}
            </Badge>
          ) : null}
        </div>
        <ArrowRight
          aria-hidden="true"
          className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <p className="line-clamp-3 text-sm leading-[1.6] text-muted-foreground">
          {summary}
        </p>
        {lifecycleHint ? (
          <p
            data-slot="lifecycle-hint"
            className="text-[11.5px] leading-5 text-muted-foreground"
          >
            {lifecycleHint}
          </p>
        ) : null}
      </div>

      <dl className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft-foreground">
        <div className="flex items-center gap-1">
          <dt className="sr-only">{labels.versionPrefix}</dt>
          <dd className="font-mono">
            <span aria-hidden="true">{labels.versionPrefix}</span>
            <span className="ms-0.5">{skill.version}</span>
          </dd>
        </div>
        <span aria-hidden="true">·</span>
        <div className="flex items-center gap-1">
          <dt className="sr-only">{labels.verifiedPrefix}</dt>
          <dd>
            <span aria-hidden="true">{labels.verifiedPrefix}</span>
            <span className="ms-1 font-mono">{skill.lastVerified}</span>
          </dd>
        </div>
      </dl>
    </Link>
  );
}
