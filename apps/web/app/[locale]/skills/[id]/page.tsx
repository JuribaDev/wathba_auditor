import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, ExternalLink, FileText, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { isLocale, locales, type AppLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";
import { generatedSkills, generatedSkillsById } from "@/lib/skills/generated";
import {
  lifecycleLabelKey,
  mapStatus,
  resolveCategoryLabelKey,
  statusLabelKey,
} from "@/lib/skills/labels";

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
  const lifecycleLabel = t(lifecycleLabelKey(skill.lifecycle));
  const maintainerHandles = skill.maintainers.map((m) => m.github).join(", ");
  const isDeprecated = skill.lifecycle === "deprecated";
  const isArchived = skill.lifecycle === "archived";
  const replacement = skill.replacementId ? generatedSkillsById[skill.replacementId] : undefined;
  const lifecycleNote =
    skill.lifecycleNote?.[locale as AppLocale] ?? skill.lifecycleNote?.en ?? null;

  return (
    <AppShell locale={locale} section="skills">
      <article className="mx-auto grid max-w-4xl gap-10 py-10 lg:py-14">
        <Link
          href={`/${locale}/skills`}
          className="inline-flex items-center gap-2 self-start rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          {t("back")}
        </Link>

        <header className="grid gap-5" data-lifecycle={skill.lifecycle}>
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
            {skill.lifecycle !== "active" ? (
              <Badge
                variant="outline"
                className={
                  isArchived
                    ? "rounded-full border-muted-foreground/40 px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground rtl:tracking-normal rtl:normal-case"
                    : "rounded-full border-warning/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] text-warning rtl:tracking-normal rtl:normal-case"
                }
                data-slot="lifecycle-badge"
                data-lifecycle={skill.lifecycle}
                aria-label={`${t("lifecycleLabel")}: ${lifecycleLabel}`}
              >
                {lifecycleLabel}
              </Badge>
            ) : null}
          </div>

          <h1 className="font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-[2.75rem]">
            {skill.name[locale as AppLocale]}
          </h1>

          <p className="max-w-[56ch] text-base leading-7 text-muted-foreground">{summary}</p>
        </header>

        {isDeprecated || isArchived ? (
          <div data-slot="lifecycle-banner" data-lifecycle={skill.lifecycle}>
            <Notice
              variant={isArchived ? "info" : "warning"}
              title={
                isArchived
                  ? t("lifecycleBannerArchivedTitle")
                  : t("lifecycleBannerDeprecatedTitle")
              }
            >
              <p>
                {isArchived
                  ? t("lifecycleBannerArchivedBody")
                  : t("lifecycleBannerDeprecatedBody")}
              </p>
              {lifecycleNote ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{lifecycleNote}</p>
              ) : null}
              <dl className="mt-3 grid gap-1.5 text-sm">
                {replacement ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <dt className="text-muted-foreground">{t("lifecycleReplacementLabel")}:</dt>
                    <dd>
                      <Link
                        data-slot="lifecycle-replacement-link"
                        href={`/${locale}/skills/${replacement.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {replacement.name[locale as AppLocale]}
                      </Link>
                    </dd>
                  </div>
                ) : null}
                {skill.sunsetDate ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <dt className="text-muted-foreground">{t("lifecycleSunsetLabel")}:</dt>
                    <dd className="font-mono">{skill.sunsetDate}</dd>
                  </div>
                ) : null}
              </dl>
            </Notice>
          </div>
        ) : null}

        <nav
          aria-label={t("contributorActionsLabel")}
          data-slot="contributor-actions"
          className="flex flex-wrap items-center gap-2"
        >
          <Button asChild size="sm" variant="outline" data-action="update">
            <Link href={`/${locale}/skills/contribute?action=update&id=${skill.id}`}>
              <Pencil aria-hidden="true" className="size-4" />
              {t("updateSkillCta")}
            </Link>
          </Button>
          {isDeprecated || isArchived ? (
            <Button asChild size="sm" variant="outline" data-action="reactivate">
              <Link href={`/${locale}/skills/contribute?action=update&id=${skill.id}`}>
                <RotateCcw aria-hidden="true" className="size-4" />
                {t("reactivateSkillCta")}
              </Link>
            </Button>
          ) : null}
          {!isArchived ? (
            <Button asChild size="sm" variant="outline" data-action="retire">
              <Link href={`/${locale}/skills/contribute?action=retire&id=${skill.id}`}>
                <Archive aria-hidden="true" className="size-4" />
                {t("retireSkillCta")}
              </Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost" data-action="delete">
            <Link
              href={`/${locale}/skills/contribute?action=delete&id=${skill.id}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {t("deleteSkillCta")}
            </Link>
          </Button>
        </nav>

        {skill.disclaimer ? (
          <Notice variant="warning" title={t("disclaimerTitle")}>
            {t("disclaimerBody")}
          </Notice>
        ) : null}

        <Separator />

        <section
          aria-labelledby="skill-preview-heading"
          className="grid gap-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="skill-preview-heading"
              className="font-heading text-xl font-medium tracking-tight"
            >
              {t("preview")}
            </h2>
            <p className="max-w-[46ch] text-xs leading-6 text-muted-foreground">
              {t("previewCaption")}
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <figcaption className="flex items-center gap-2 border-b border-border bg-surface-variant/70 px-5 py-3 font-mono text-xs text-muted-foreground">
              <FileText aria-hidden="true" className="size-3.5" />
              <span>{t("previewFilename")}</span>
            </figcaption>
            <pre
              dir="ltr"
              className="max-h-[480px] overflow-auto px-5 py-5 font-mono text-xs leading-6 whitespace-pre-wrap break-words text-foreground"
            >
              {skill.body}
            </pre>
          </figure>
        </section>

        <section
          aria-labelledby="skill-panels-heading"
          className="grid gap-4"
        >
          <h2 id="skill-panels-heading" className="sr-only">
            {t("assets")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Panel label={t("variables")}>
              {skill.variables.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noVariables")}</p>
              ) : (
                <ul className="grid gap-2">
                  {skill.variables.map((variable) => (
                    <li key={variable.name} className="text-sm leading-6">
                      <code className="rounded bg-secondary/70 px-1.5 py-0.5 font-mono text-[0.78rem] text-foreground">
                        {variable.name}
                      </code>
                      <span className="ms-2 text-muted-foreground">
                        · {variable.label[locale as AppLocale]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel label={t("references")}>
              {skill.references.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noReferences")}</p>
              ) : (
                <div className="grid gap-3">
                  <div className="text-sm">
                    <span className="font-mono text-foreground">{skill.references.length}</span>
                    <span className="ms-1.5 text-muted-foreground">{t("filesLabel")}</span>
                  </div>
                  <ul className="grid gap-1.5">
                    {skill.references.map((reference) => (
                      <li
                        key={reference.path}
                        className="font-mono text-xs text-muted-foreground"
                        dir="ltr"
                      >
                        {reference.path}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>

            <Panel label={t("scripts")}>
              {skill.scripts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noScripts")}</p>
              ) : (
                <div className="grid gap-3">
                  <div className="text-sm">
                    <span className="font-mono text-foreground">{skill.scripts.length}</span>
                    <span className="ms-1.5 text-muted-foreground">{t("scriptsLabel")}</span>
                  </div>
                  <ul className="grid gap-1.5">
                    {skill.scripts.map((script) => (
                      <li
                        key={script.path}
                        className="font-mono text-xs text-muted-foreground"
                        dir="ltr"
                      >
                        {script.path}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
          </div>
        </section>

        {skill.sources.length > 0 ? (
          <section
            aria-labelledby="skill-sources-heading"
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <h2
              id="skill-sources-heading"
              className="mb-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground rtl:tracking-normal rtl:normal-case"
            >
              {t("sources")}
            </h2>
            <ul className="grid gap-3">
              {skill.sources.map((source) => (
                <li key={source.url}>
                  <a
                    className="group inline-flex flex-wrap items-center gap-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    href={source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                    <span>{source.title}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      · {t("sourceAccessed")}{" "}
                      <span className="font-mono">{source.accessed}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>{t("maintainedBy")}</span>
            <strong className="font-mono text-sm text-foreground">{maintainerHandles}</strong>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span>{t("versionLabel")}</span>
            <strong className="font-mono text-sm text-foreground">v{skill.version}</strong>
          </div>
        </footer>
      </article>
    </AppShell>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground rtl:tracking-normal rtl:normal-case">
        {label}
      </h3>
      {children}
    </div>
  );
}
