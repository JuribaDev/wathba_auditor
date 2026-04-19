import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isLocale, locales } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";
import { generatedSkills, generatedSkillsById } from "@/lib/skills/generated";

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

  return (
    <AppShell
      locale={locale}
      section="skills"
      title={skill.name[locale]}
      description={t("description")}
    >
      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{skill.category}</Badge>
              <Badge variant="outline">{skill.status}</Badge>
              {skill.region ? <Badge variant="outline">{skill.region}</Badge> : null}
            </div>
            <CardTitle className="text-2xl">{skill.name[locale]}</CardTitle>
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
                    {variable.label[locale]}
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
            <Link className="text-primary hover:text-primary/80" href={`/${locale}/skills`}>
              {t("back")}
            </Link>
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

