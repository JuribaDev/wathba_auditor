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
  const frames = [
    {
      lang: "en" as const,
      dir: "ltr" as const,
      title: t("enFrame.title"),
      body: t("enFrame.body"),
    },
    {
      lang: "ar" as const,
      dir: "rtl" as const,
      title: t("arFrame.title"),
      body: t("arFrame.body"),
    },
  ];

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
