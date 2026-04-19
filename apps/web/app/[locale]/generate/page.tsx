import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Questionnaire } from "@/components/questionnaire";
import type { QuestionnaireLabels } from "@/components/questionnaire-shell";
import type { AboutStepLabels } from "@/components/questionnaire/step-about";
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

  const shellLabels: QuestionnaireLabels = {
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

  const aboutLabels: AboutStepLabels = {
    marketTitle: t("about.market.title"),
    marketDesc: t("about.market.desc"),
    marketWhy: t("about.market.why"),
    marketOptionKsaLabel: t("about.market.options.ksa.label"),
    marketOptionKsaDesc: t("about.market.options.ksa.desc"),
    marketOptionGccLabel: t("about.market.options.gcc.label"),
    marketOptionGccDesc: t("about.market.options.gcc.desc"),
    marketOptionGlobalLabel: t("about.market.options.global.label"),
    marketOptionGlobalDesc: t("about.market.options.global.desc"),
    invoicingTitle: t("about.invoicing.title"),
    invoicingDesc: t("about.invoicing.desc"),
    invoicingWhy: t("about.invoicing.why"),
    piiTitle: t("about.pii.title"),
    piiDesc: t("about.pii.desc"),
    piiWhy: t("about.pii.why"),
    paymentsTitle: t("about.payments.title"),
    paymentsDesc: t("about.payments.desc"),
    paymentsWhy: t("about.payments.why"),
    identityTitle: t("about.identity.title"),
    identityDesc: t("about.identity.desc"),
    identityWhy: t("about.identity.why"),
    yes: t("about.yes"),
    no: t("about.no"),
    whyAsk: t("about.whyAsk"),
  };

  return (
    <AppShell locale={locale} section="generate">
      <div className="mx-auto w-full max-w-3xl">
        <Questionnaire
          locale={locale}
          shellLabels={shellLabels}
          aboutLabels={aboutLabels}
        />
      </div>
    </AppShell>
  );
}
