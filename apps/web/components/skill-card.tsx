import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AppLocale } from "@/lib/i18n";
import type { GeneratedSkill } from "@/lib/skills/generated";
import {
  mapStatus,
  resolveCategoryLabelKey,
  statusLabelKey,
} from "@/lib/skills/labels";

export type SkillCardMetaLabels = {
  category: Record<
    "categorySaudi" | "categoryCompliance" | "categorySecurity" | "categoryArchitecture",
    string
  >;
  status: Record<"statusReviewed" | "statusCommunity" | "statusDraft", string>;
  disclaimer: string;
  disclaimerTitle: string;
  versionPrefix: string;
  verifiedPrefix: string;
};

type SkillCardProps = {
  locale: AppLocale;
  skill: GeneratedSkill;
  labels: SkillCardMetaLabels;
  children: ReactNode;
};

export function SkillCard({ locale, skill, labels, children }: SkillCardProps) {
  const summary =
    skill.summary?.[locale] ??
    skill.body
      .split("\n")
      .find((line) => line.trim().length > 0 && !line.trim().startsWith("#")) ??
    "";

  const categoryLabel = labels.category[resolveCategoryLabelKey(skill)];
  const status = mapStatus(skill.status);
  const statusLabel = labels.status[statusLabelKey(status)];

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] rtl:tracking-normal rtl:normal-case"
          >
            {categoryLabel}
          </Badge>
          <StatusBadge status={status}>{statusLabel}</StatusBadge>
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
        <CardTitle className="text-xl">{skill.name[locale]}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm leading-7 text-muted-foreground">
        <p>{summary}</p>
        <div className="flex flex-wrap gap-2">
          {skill.targets.map((target) => (
            <Badge key={target} variant="outline">
              {target}
            </Badge>
          ))}
        </div>
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{labels.versionPrefix}</dt>
            <dd>
              <span aria-hidden="true" className="text-muted-foreground">
                {labels.versionPrefix}
              </span>
              <span className="ms-1 font-mono text-foreground">{skill.version}</span>
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{labels.verifiedPrefix}</dt>
            <dd>
              <span aria-hidden="true" className="text-muted-foreground">
                {labels.verifiedPrefix}
              </span>
              <span className="ms-1 font-mono text-foreground">{skill.lastVerified}</span>
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="text-sm text-primary">{children}</CardFooter>
    </Card>
  );
}
