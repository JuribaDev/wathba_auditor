import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Questionnaire } from "@/components/questionnaire";
import type { QuestionnaireLabels } from "@/components/questionnaire-shell";
import type { AboutStepLabels } from "@/components/questionnaire/step-about";
import type { ReviewStepLabels } from "@/components/questionnaire/step-review";
import type { TechStepLabels } from "@/components/questionnaire/step-tech";
import { isLocale } from "@/lib/i18n";
import type { ValidationMessages } from "@/lib/questionnaire/validation";
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

  const techLabels: TechStepLabels = {
    stackTitle: t("tech.stack.title"),
    stackDesc: t("tech.stack.desc"),
    stackOptionNodejsLabel: t("tech.stack.options.nodejs.label"),
    stackOptionNodejsDesc: t("tech.stack.options.nodejs.desc"),
    stackOptionPythonLabel: t("tech.stack.options.python.label"),
    stackOptionPythonDesc: t("tech.stack.options.python.desc"),
    stackOptionPhpLabel: t("tech.stack.options.php.label"),
    stackOptionPhpDesc: t("tech.stack.options.php.desc"),
    stackOptionGoLabel: t("tech.stack.options.go.label"),
    stackOptionGoDesc: t("tech.stack.options.go.desc"),
    stackOptionOtherLabel: t("tech.stack.options.other.label"),
    stackOptionOtherDesc: t("tech.stack.options.other.desc"),
    agentsTitle: t("tech.agents.title"),
    agentsDesc: t("tech.agents.desc"),
    agentsOptionClaudeLabel: t("tech.agents.options.claude.label"),
    agentsOptionClaudeDesc: t("tech.agents.options.claude.desc"),
    agentsOptionCursorLabel: t("tech.agents.options.cursor.label"),
    agentsOptionCursorDesc: t("tech.agents.options.cursor.desc"),
    agentsOptionCodexLabel: t("tech.agents.options.codex.label"),
    agentsOptionCodexDesc: t("tech.agents.options.codex.desc"),
    agentsOptionGenericLabel: t("tech.agents.options.generic.label"),
    agentsOptionGenericDesc: t("tech.agents.options.generic.desc"),
    ciTitle: t("tech.ci.title"),
    ciDesc: t("tech.ci.desc"),
    ciWhy: t("tech.ci.why"),
    secretsTitle: t("tech.secrets.title"),
    secretsDesc: t("tech.secrets.desc"),
    secretsOptionManagerLabel: t("tech.secrets.options.manager.label"),
    secretsOptionManagerDesc: t("tech.secrets.options.manager.desc"),
    secretsOptionEnvLabel: t("tech.secrets.options.env.label"),
    secretsOptionEnvDesc: t("tech.secrets.options.env.desc"),
    secretsOptionDotenvLabel: t("tech.secrets.options.dotenv.label"),
    secretsOptionDotenvDesc: t("tech.secrets.options.dotenv.desc"),
    secretsOptionNoneLabel: t("tech.secrets.options.none.label"),
    secretsOptionNoneDesc: t("tech.secrets.options.none.desc"),
    yes: t("about.yes"),
    no: t("about.no"),
    whyAsk: t("about.whyAsk"),
  };

  const reviewLabels: ReviewStepLabels = {
    autoLabel: t("review.autoLabel"),
    manualLabel: t("review.manualLabel"),
    statusReviewed: t("review.statusReviewed"),
    statusCommunity: t("review.statusCommunity"),
    statusDraft: t("review.statusDraft"),
    versionPrefix: t("review.versionPrefix"),
    verifiedPrefix: t("review.verifiedPrefix"),
    disclaimer: t("review.disclaimer"),
    enable: t("review.enable"),
    disable: t("review.disable"),
    empty: t("review.empty"),
  };

  const validationMessages: ValidationMessages = {
    market: t("errors.market"),
    pii: t("errors.pii"),
    invoicing: t("errors.invoicing"),
    payments: t("errors.payments"),
    identity: t("errors.identity"),
    stack: t("errors.stack"),
    agents: t("errors.agents"),
    ci: t("errors.ci"),
    secrets: t("errors.secrets"),
  };

  return (
    <AppShell locale={locale} section="generate">
      <div className="mx-auto w-full max-w-3xl">
        <Questionnaire
          locale={locale}
          shellLabels={shellLabels}
          aboutLabels={aboutLabels}
          techLabels={techLabels}
          reviewLabels={reviewLabels}
          validationMessages={validationMessages}
        />
      </div>
    </AppShell>
  );
}
