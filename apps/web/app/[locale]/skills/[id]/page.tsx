import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { isLocale, locales, type AppLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";
import { generatedSkills, generatedSkillsById } from "@/lib/skills/generated";
import { mapStatus, resolveCategoryLabelKey, statusLabelKey } from "@/lib/skills/labels";

type SkillDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => generatedSkills.map((skill) => ({ locale, id: skill.id })));
}

export default async function SkillDetailPage({ params }: SkillDetailPageProps) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const skill = generatedSkillsById[id];

  if (!skill) {
    notFound();
  }

  const t = await getTranslator(locale, "SkillDetail");
  const summary = skill.summary?.[locale] ?? t("summaryFallback");
  const categoryLabel = t(resolveCategoryLabelKey(skill));
  const status = mapStatus(skill.status);
  const statusLabel = t(statusLabelKey(status));

  return (
    <AppShell locale={locale} section="skills">
      <article className="mx-auto grid max-w-3xl gap-10 py-10 lg:py-14">
        <Link
          href={`/${locale}/skills`}
          className="inline-flex items-center gap-2 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          {t("back")}
        </Link>

        <header className="grid gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] rtl:tracking-normal rtl:normal-case"
            >
              {categoryLabel}
            </Badge>
            <StatusBadge status={status}>{statusLabel}</StatusBadge>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 font-mono text-xs"
              aria-label={`${t("version")} ${skill.version}`}
            >
              v{skill.version}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-xs"
              aria-label={`${t("verified")} ${skill.lastVerified}`}
            >
              <span className="text-muted-foreground">{t("verifiedLabel")}</span>
              <span className="ms-1.5 font-mono">{skill.lastVerified}</span>
            </Badge>
          </div>

          <h1 className="font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-[2.75rem]">
            {skill.name[locale as AppLocale]}
          </h1>

          <p className="max-w-[56ch] text-base leading-7 text-muted-foreground">
            {summary}
          </p>
        </header>

        {skill.disclaimer ? (
          <Notice variant="warning" title={t("disclaimerTitle")}>
            {t("disclaimerBody")}
          </Notice>
        ) : null}

        <Separator />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
          <Card>
            <CardHeader className="gap-3">
              <CardTitle className="text-lg">{skill.name[locale as AppLocale]}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm leading-7 text-muted-foreground">
              <MetadataRow label={t("version")} value={skill.version} />
              <MetadataRow label={t("verified")} value={skill.lastVerified} />
              <MetadataRow label={t("targets")} value={skill.targets.join(", ")} />
              <div className="grid gap-2">
                <span className="font-medium text-foreground">{t("variables")}</span>
                <div className="flex flex-wrap gap-2">
                  {skill.variables.map((variable) => (
                    <Badge key={variable.name} variant="outline">
                      {variable.label[locale as AppLocale]}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="grid gap-2">
                <span className="font-medium text-foreground">{t("sources")}</span>
                <ul className="grid gap-2">
                  {skill.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        className="text-primary hover:text-primary/80"
                        href={source.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div className="grid gap-2">
                <span className="font-medium text-foreground">{t("assets")}</span>
                <p>
                  {skill.references.length} {t("references")} · {skill.scripts.length} {t("scripts")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("preview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownPreview markdown={skill.body} />
            </CardContent>
          </Card>
        </section>
      </article>
    </AppShell>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="font-medium text-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
