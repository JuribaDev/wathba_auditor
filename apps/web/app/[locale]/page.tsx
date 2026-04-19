import { ArrowRight, Languages, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";
import { generatedSkills } from "@/lib/skills/generated";

type LandingProps = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: LandingProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslator(locale, "Landing");
  const features = getFeatureCopy(locale);
  const seedSkill = generatedSkills[0];

  return (
    <AppShell
      locale={locale}
      section="home"
      title={t("title")}
      description={t("description")}
      actions={
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href={`/${locale}/generate`}>
              {t("primaryAction")}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/skills`}>{t("secondaryAction")}</Link>
          </Button>
        </div>
      }
    >
      <section className="grid gap-5 lg:grid-cols-[1.4fr_minmax(0,0.8fr)]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t("statusBadge")}</Badge>
              <Badge variant="outline">{t("rtlBadge")}</Badge>
            </div>
            <CardTitle className="max-w-2xl text-3xl leading-tight sm:text-4xl">
              {t("headline")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm leading-7 text-muted-foreground sm:grid-cols-3">
            {features.map((feature) => (
              <div className="flex flex-col gap-2" key={feature.title}>
                <strong className="text-sm text-foreground">{feature.title}</strong>
                <p>{feature.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {seedSkill ? (
          <Card className="border-primary/15 bg-secondary/40">
            <CardHeader className="gap-4">
              <Badge variant="outline">{t("seedSkillBadge")}</Badge>
              <CardTitle className="text-2xl leading-snug">
                {seedSkill.name[locale as AppLocale]}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm leading-7 text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="size-4" />
                <span>{t("seedSkillStatus")}</span>
              </div>
              <p>{t("seedSkillDescription")}</p>
              <div className="flex items-center gap-2 text-foreground">
                <Languages className="size-4" />
                <span>{t("seedSkillLocale")}</span>
              </div>
              <Button asChild variant="outline">
                <Link href={`/${locale}/skills/${seedSkill.id}`}>{t("seedSkillAction")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </AppShell>
  );
}

function getFeatureCopy(locale: AppLocale) {
  if (locale === "ar") {
    return [
      {
        title: "مكتبة مهارات قابلة للمراجعة",
        body: "القيمة الأساسية تعيش في `skills/` وليس داخل الواجهة، حتى يتمكن المساهمون من تطوير المحتوى الإقليمي بشكل مستقل.",
      },
      {
        title: "امتثال وأمن وبنية",
        body: "الاقتراحات موجهة للأنظمة السعودية، وإدارة الأسرار، وحدود المصادقة، وأنماط البنية القابلة للصيانة.",
      },
      {
        title: "حزم قابلة للتنزيل",
        body: "الواجهة تنتج ملفات جاهزة للوكلاء المستهدفين بدون خادم أو حسابات أو تخزين سحابي.",
      },
    ];
  }

  return [
    {
      title: "Auditable skill library",
      body: "The durable value lives in `skills/`, not inside the UI, so contributors can ship regional expertise without touching the app.",
    },
    {
      title: "Compliance, security, architecture",
      body: "Recommendations are shaped for Saudi regulations, secret handling, auth boundaries, and maintainable delivery habits.",
    },
    {
      title: "Downloadable agent packs",
      body: "The frontend produces ready-to-drop files for multiple agent targets without introducing a backend or user accounts.",
    },
  ];
}

