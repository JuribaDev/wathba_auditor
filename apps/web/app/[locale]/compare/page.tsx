import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isLocale, locales } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";

type ComparePageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslator(locale, "Compare");
  const frames = getFrames();

  return (
    <AppShell
      locale={locale}
      section="compare"
      title={t("title")}
      description={t("description")}
    >
      <section className="grid gap-5 lg:grid-cols-2">
        {frames.map((frame) => (
          <Card key={frame.dir} dir={frame.dir} lang={frame.lang}>
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">{frame.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              {frame.body}
            </CardContent>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}

function getFrames() {
  return [
    {
      lang: "en",
      dir: "ltr" as const,
      title: "English · LTR",
      body: "Landing, questionnaire, review, generate, and detail screens render here in English with left-to-right layout.",
    },
    {
      lang: "ar",
      dir: "rtl" as const,
      title: "العربية · RTL",
      body: "تظهر هنا شاشات الواجهة والاستبيان والمراجعة والتوليد والتفاصيل بالعربية وباتجاه من اليمين إلى اليسار.",
    },
  ];
}
