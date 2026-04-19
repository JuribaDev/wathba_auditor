import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Questionnaire } from "@/components/questionnaire";
import type { QuestionnaireLabels } from "@/components/questionnaire-shell";
import type { AboutStepLabels } from "@/components/questionnaire/step-about";
import type { GenerateStepLabels } from "@/components/questionnaire/step-generate";
import type { ReviewStepLabels } from "@/components/questionnaire/step-review";
import type { TechStepLabels } from "@/components/questionnaire/step-tech";
import type { VariablesStepLabels } from "@/components/questionnaire/step-variables";
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
    validationBlocked: t("validationBlocked"),
    startOver: t("startOver"),
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

  const variablesLabels: VariablesStepLabels = {
    heading: t("variables.heading"),
    lede: t("variables.lede"),
    yes: t("variables.yes"),
    no: t("variables.no"),
    selectPlaceholder: t("variables.selectPlaceholder"),
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
    addAnotherSummary: t("review.addAnotherSummary"),
    addAnotherLede: t("review.addAnotherLede"),
    addAnotherEmpty: t("review.addAnotherEmpty"),
    addAction: t("review.addAction"),
  };

  const generateLabels: GenerateStepLabels = {
    zipLabel: t("generate.zipLabel"),
    zipFilename: t("generate.zipFilename"),
    totalLabel: t("generate.totalLabel"),
    filesLabel: t("generate.filesLabel"),
    skillsLabel: t("generate.skillsLabel"),
    targetClaude: t("generate.targets.claude"),
    targetCursor: t("generate.targets.cursor"),
    targetCodex: t("generate.targets.codex"),
    targetGeneric: t("generate.targets.generic"),
    targetPreviewHeading: t("generate.targetPreviewHeading"),
    targetNoteClaude: t("generate.targetNotes.claude"),
    targetNoteCursor: t("generate.targetNotes.cursor"),
    targetNoteCodex: t("generate.targetNotes.codex"),
    targetNoteGeneric: t("generate.targetNotes.generic"),
    previewEmpty: t("generate.previewEmpty"),
    previewFilePlaceholder: t("generate.previewFilePlaceholder"),
    missingTitle: t("generate.missingTitle"),
    missingLede: t("generate.missingLede"),
    missingVariableLabel: t("generate.missingVariableLabel"),
    emptyTitle: t("generate.emptyTitle"),
    emptyBody: t("generate.emptyBody"),
    downloadCta: t("generate.downloadCta"),
    downloadWorking: t("generate.downloadWorking"),
    downloadReady: t("generate.downloadReady"),
    downloadHint: t("generate.downloadHint"),
    downloadDisabledMissing: t("generate.downloadDisabledMissing"),
    downloadError: t("generate.downloadError"),
    install: {
      eyebrow: t("generate.install.eyebrow"),
      heading: t("generate.install.heading"),
      lede: t("generate.install.lede"),
      filesLabel: t("generate.install.filesLabel"),
      sizeLabel: t("generate.install.sizeLabel"),
      copyCta: t("generate.install.copyCta"),
      copyCopied: t("generate.install.copyCopied"),
      copyFallback: t("generate.install.copyFallback"),
      previewHeading: t("generate.install.previewHeading"),
      expand: t("generate.install.expand"),
      collapse: t("generate.install.collapse"),
      fallbackNote: t("generate.install.fallbackNote"),
      agentClaudeName: t("generate.install.agents.claude.name"),
      agentClaudeTagline: t("generate.install.agents.claude.tagline"),
      agentCursorName: t("generate.install.agents.cursor.name"),
      agentCursorTagline: t("generate.install.agents.cursor.tagline"),
      agentCodexName: t("generate.install.agents.codex.name"),
      agentCodexTagline: t("generate.install.agents.codex.tagline"),
      agentGenericName: t("generate.install.agents.generic.name"),
      agentGenericTagline: t("generate.install.agents.generic.tagline"),
    },
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
          variablesLabels={variablesLabels}
          generateLabels={generateLabels}
          validationMessages={validationMessages}
        />
      </div>
    </AppShell>
  );
}
