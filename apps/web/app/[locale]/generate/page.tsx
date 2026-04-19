import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import {
  QuestionnaireShell,
  type QuestionnaireLabels,
} from "@/components/questionnaire-shell";
import { isLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";

type GeneratePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GeneratePage({ params }: GeneratePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslator(locale, "Questionnaire");

  const labels: QuestionnaireLabels = {
    ariaLabel: t("ariaLabel"),
    stepAbout: t("stepAbout"),
    stepTech: t("stepTech"),
    stepReview: t("stepReview"),
    stepGenerate: t("stepGenerate"),
    aboutHeading: t("aboutHeading"),
    aboutLede: t("aboutLede"),
    aboutPlaceholder: t("aboutPlaceholder"),
    techHeading: t("techHeading"),
    techLede: t("techLede"),
    techPlaceholder: t("techPlaceholder"),
    reviewHeading: t("reviewHeading"),
    reviewLede: t("reviewLede"),
    reviewPlaceholder: t("reviewPlaceholder"),
    generateHeading: t("generateHeading"),
    generateLede: t("generateLede"),
    generatePlaceholder: t("generatePlaceholder"),
    eyebrowOf: t("eyebrowOf"),
    prev: t("prev"),
    next: t("next"),
    downloadCta: t("downloadCta"),
    stepPositionLabel: t("stepPositionLabel"),
  };

  return (
    <AppShell locale={locale} section="generate">
      <div className="mx-auto w-full max-w-3xl">
        <QuestionnaireShell locale={locale} labels={labels} />
      </div>
    </AppShell>
  );
}
