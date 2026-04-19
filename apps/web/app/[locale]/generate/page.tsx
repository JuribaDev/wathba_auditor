import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";

type GeneratePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GeneratePage({ params }: GeneratePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslator(locale, "Generate");
  const sections = getQuestionnaireSections(locale);

  return (
    <AppShell
      locale={locale}
      section="generate"
      title={t("title")}
      description={t("description")}
    >
      <section className="grid gap-4">
        {sections.map((section, index) => (
          <Card key={section.title}>
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">
                {index + 1}. {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              {section.body}
            </CardContent>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}

function getQuestionnaireSections(locale: AppLocale) {
  if (locale === "ar") {
    return [
      {
        title: "نطاق السوق والامتثال",
        body: "يبدأ التدفق بتحديد السوق المستهدف وطبيعة الفواتير والهوية والبيانات الشخصية والمدفوعات حتى يتم اقتراح المهارات المناسبة تلقائياً.",
      },
      {
        title: "السياق التقني",
        body: "يتم جمع معلومات عن الـ stack والوكيل المستهدف وجاهزية الاختبارات و CI وإدارة الأسرار داخل المستودع.",
      },
      {
        title: "المعاينة والتنزيل",
        body: "بعد الإجابات تظهر المهارات الموصى بها مع إمكانية التعديل ثم تنزيل ملف zip منظم حسب الوكيل المستهدف.",
      },
    ];
  }

  return [
    {
      title: "Market and compliance scope",
      body: "The flow starts by identifying target market, invoicing patterns, identity verification, personal data handling, and payment paths.",
    },
    {
      title: "Technical context",
      body: "It then captures stack, target agents, tests, CI, and secret-handling maturity so recommendations fit the repo reality.",
    },
    {
      title: "Preview and download",
      body: "Recommended skills are reviewed before a target-specific zip is produced, keeping the generator shareable and static-host friendly.",
    },
  ];
}

