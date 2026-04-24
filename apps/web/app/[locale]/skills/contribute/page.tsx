import { Suspense } from "react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ContributorWizard, type ContributorWizardLabels } from "@/components/contributor-wizard";
import { isLocale, locales } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";
import { generatedSkills } from "@/lib/skills/generated";

type ContributePageProps = {
  params: Promise<{ locale: string }>;
};

// Contributor route ships with `output: "export"`. Query parsing must stay
// on the client — the ContributorWizard reads `action=` and `id=` from the
// browser URL via `useSearchParams` and hydrates in-place. Keep this page
// a pure static render so next build can prerender every locale.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ContributePage({ params }: ContributePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const tContribute = await getTranslator(locale, "Contribute");
  const tShell = await getTranslator(locale, "ContributeShell");
  const tContributeAi = await getTranslator(locale, "ContributeViaAi");

  const labels: ContributorWizardLabels = {
    shell: {
      ariaLabel: tShell("ariaLabel"),
      eyebrowOf: tShell("eyebrowOf"),
      stepPosition: tShell("stepPosition"),
      next: tShell("next"),
      previous: tShell("previous"),
      startOver: tShell("startOver"),
      finish: tShell("finish"),
    },
    stepActionLabel: tContribute("stepActionLabel"),
    stepMetadataLabel: tContribute("stepMetadataLabel"),
    stepContentLabel: tContribute("stepContentLabel"),
    stepGovernanceLabel: tContribute("stepGovernanceLabel"),
    stepHandoffLabel: tContribute("stepHandoffLabel"),
    actionHeading: tContribute("actionHeading"),
    actionLede: tContribute("actionLede"),
    metadataHeading: tContribute("metadataHeading"),
    metadataLede: tContribute("metadataLede"),
    contentHeading: tContribute("contentHeading"),
    contentLede: tContribute("contentLede"),
    governanceHeading: tContribute("governanceHeading"),
    governanceLede: tContribute("governanceLede"),
    handoffHeading: tContribute("handoffHeading"),
    handoffLede: tContribute("handoffLede"),
    actionAdd: tContribute("actionAdd"),
    actionAddTagline: tContribute("actionAddTagline"),
    actionUpdate: tContribute("actionUpdate"),
    actionUpdateTagline: tContribute("actionUpdateTagline"),
    actionRetire: tContribute("actionRetire"),
    actionRetireTagline: tContribute("actionRetireTagline"),
    actionDelete: tContribute("actionDelete"),
    actionDeleteTagline: tContribute("actionDeleteTagline"),
    fieldsGroup: tContribute("fieldsGroup"),
    fieldsSlug: tContribute("fieldsSlug"),
    fieldsId: tContribute("fieldsId"),
    fieldsPreviousId: tContribute("fieldsPreviousId"),
    fieldsNameEn: tContribute("fieldsNameEn"),
    fieldsNameAr: tContribute("fieldsNameAr"),
    fieldsSummaryEn: tContribute("fieldsSummaryEn"),
    fieldsSummaryAr: tContribute("fieldsSummaryAr"),
    fieldsCategory: tContribute("fieldsCategory"),
    fieldsRegion: tContribute("fieldsRegion"),
    fieldsTargets: tContribute("fieldsTargets"),
    fieldsStatus: tContribute("fieldsStatus"),
    fieldsMaintainers: tContribute("fieldsMaintainers"),
    fieldsSources: tContribute("fieldsSources"),
    fieldsDisclaimer: tContribute("fieldsDisclaimer"),
    fieldsVariables: tContribute("fieldsVariables"),
    fieldsTriggers: tContribute("fieldsTriggers"),
    fieldsSupportFiles: tContribute("fieldsSupportFiles"),
    fieldsIntent: tContribute("fieldsIntent"),
    fieldsEditSummary: tContribute("fieldsEditSummary"),
    fieldsLifecycle: tContribute("fieldsLifecycle"),
    fieldsReplacementId: tContribute("fieldsReplacementId"),
    fieldsSunsetDate: tContribute("fieldsSunsetDate"),
    fieldsLifecycleNoteEn: tContribute("fieldsLifecycleNoteEn"),
    fieldsLifecycleNoteAr: tContribute("fieldsLifecycleNoteAr"),
    fieldsDeleteConfirmation: tContribute("fieldsDeleteConfirmation"),
    fieldsDeleteRationale: tContribute("fieldsDeleteRationale"),
    actionRequired: tContribute("actionRequired"),
    skillRequired: tContribute("skillRequired"),
    categoryCompliance: tContribute("categoryCompliance"),
    categorySecurity: tContribute("categorySecurity"),
    categoryArchitecture: tContribute("categoryArchitecture"),
    statusReviewed: tContribute("statusReviewed"),
    statusCommunity: tContribute("statusCommunity"),
    statusDraft: tContribute("statusDraft"),
    lifecycleActive: tContribute("lifecycleActive"),
    lifecycleDeprecated: tContribute("lifecycleDeprecated"),
    lifecycleArchived: tContribute("lifecycleArchived"),
    governanceCurrentVersion: tContribute("governanceCurrentVersion"),
    governanceEstimatedVersion: tContribute("governanceEstimatedVersion"),
    governanceEstimatedBump: tContribute("governanceEstimatedBump"),
    governanceBumpPatch: tContribute("governanceBumpPatch"),
    governanceBumpMinor: tContribute("governanceBumpMinor"),
    governanceBumpMajor: tContribute("governanceBumpMajor"),
    deleteWarningTitle: tContribute("deleteWarningTitle"),
    deleteWarningBody: tContribute("deleteWarningBody"),
    deleteAcknowledge: tContribute("deleteAcknowledge"),
    addNewTargetOption: tContribute("addNewTargetOption"),
    addTargetClaude: tContribute("addTargetClaude"),
    addTargetCursor: tContribute("addTargetCursor"),
    addTargetCodex: tContribute("addTargetCodex"),
    addTargetGeneric: tContribute("addTargetGeneric"),
    addRow: tContribute("addRow"),
    removeRow: tContribute("removeRow"),
    noneNote: tContribute("noneNote"),
    contributorReturn: tContribute("contributorReturn"),
    skillSelectorLabel: tContribute("skillSelectorLabel"),
    skillSelectorNone: tContribute("skillSelectorNone"),
    validationBlockedHint: tContribute("validationBlockedHint"),
    templatePickerHeading: tContribute("templatePickerHeading"),
    templatePickerLede: tContribute("templatePickerLede"),
    templateSaudiComplianceName: tContribute("templateSaudiComplianceName"),
    templateSaudiComplianceTagline: tContribute("templateSaudiComplianceTagline"),
    templateComplianceGenericName: tContribute("templateComplianceGenericName"),
    templateComplianceGenericTagline: tContribute("templateComplianceGenericTagline"),
    templateSecurityName: tContribute("templateSecurityName"),
    templateSecurityTagline: tContribute("templateSecurityTagline"),
    templateArchitectureName: tContribute("templateArchitectureName"),
    templateArchitectureTagline: tContribute("templateArchitectureTagline"),
    templateCustomName: tContribute("templateCustomName"),
    templateCustomTagline: tContribute("templateCustomTagline"),
    hintGroup: tContribute("hintGroup"),
    hintSlug: tContribute("hintSlug"),
    hintId: tContribute("hintId"),
    hintPreviousId: tContribute("hintPreviousId"),
    hintNameEn: tContribute("hintNameEn"),
    hintNameAr: tContribute("hintNameAr"),
    hintSummaryEn: tContribute("hintSummaryEn"),
    hintSummaryAr: tContribute("hintSummaryAr"),
    hintCategory: tContribute("hintCategory"),
    hintRegion: tContribute("hintRegion"),
    hintTargets: tContribute("hintTargets"),
    hintStatus: tContribute("hintStatus"),
    hintMaintainers: tContribute("hintMaintainers"),
    hintSources: tContribute("hintSources"),
    hintDisclaimer: tContribute("hintDisclaimer"),
    hintIntent: tContribute("hintIntent"),
    hintEditSummary: tContribute("hintEditSummary"),
    validationSlug: tContribute("validationSlug"),
    validationDate: tContribute("validationDate"),
    validationUrl: tContribute("validationUrl"),
    validationRequired: tContribute("validationRequired"),
    insertOutline: tContribute("insertOutline"),
    clearOutline: tContribute("clearOutline"),
    essentialsHeading: tContribute("essentialsHeading"),
    essentialsLede: tContribute("essentialsLede"),
    identityHeading: tContribute("identityHeading"),
    identityLede: tContribute("identityLede"),
    advancedHeading: tContribute("advancedHeading"),
    advancedLede: tContribute("advancedLede"),
    attestationHeading: tContribute("attestationHeading"),
    attestationLede: tContribute("attestationLede"),
    livePreviewHeading: tContribute("livePreviewHeading"),
    livePreviewLede: tContribute("livePreviewLede"),
    readinessHeading: tContribute("readinessHeading"),
    readinessComplete: tContribute("readinessComplete"),
    readinessIncomplete: tContribute("readinessIncomplete"),
    readinessField: tContribute("readinessField"),
    contributeViaAi: {
      eyebrow: tContributeAi("eyebrow"),
      heading: tContributeAi("heading"),
      lede: tContributeAi("lede"),
      charsLabel: tContributeAi("charsLabel"),
      bumpLabel: tContributeAi("bumpLabel"),
      copyCta: tContributeAi("copyCta"),
      copyCopied: tContributeAi("copyCopied"),
      copyFallback: tContributeAi("copyFallback"),
      previewHeading: tContributeAi("previewHeading"),
      agentClaudeName: tContributeAi("agentClaudeName"),
      agentClaudeTagline: tContributeAi("agentClaudeTagline"),
      agentCursorName: tContributeAi("agentCursorName"),
      agentCursorTagline: tContributeAi("agentCursorTagline"),
      agentCodexName: tContributeAi("agentCodexName"),
      agentCodexTagline: tContributeAi("agentCodexTagline"),
      agentGenericName: tContributeAi("agentGenericName"),
      agentGenericTagline: tContributeAi("agentGenericTagline"),
      bumpPatch: tContribute("governanceBumpPatch"),
      bumpMinor: tContribute("governanceBumpMinor"),
      bumpMajor: tContribute("governanceBumpMajor"),
      fallbackNote: tContributeAi("fallbackNote"),
    },
  };

  const flowPurposeSteps = [
    tContribute("flowPurposeStep1"),
    tContribute("flowPurposeStep2"),
    tContribute("flowPurposeStep3"),
    tContribute("flowPurposeStep4"),
  ];

  return (
    <AppShell
      locale={locale}
      section="skills"
      title={tContribute("pageTitle")}
      description={tContribute("pageDescription")}
    >
      <div className="mx-auto w-full max-w-4xl py-10 lg:py-14">
        <section
          aria-labelledby="contribute-flow-purpose-heading"
          data-slot="contribute-flow-purpose"
          className="mb-8 grid gap-5 rounded-2xl border border-border bg-surface-variant/40 p-5 shadow-[var(--shadow-sm)] sm:p-6 lg:mb-10"
        >
          <header className="grid gap-2">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted-foreground rtl:tracking-normal rtl:normal-case">
              {tContribute("flowPurposeEyebrow")}
            </p>
            <h2
              id="contribute-flow-purpose-heading"
              className="font-heading text-xl leading-tight text-foreground sm:text-[1.375rem]"
            >
              {tContribute("flowPurposeTitle")}
            </h2>
            <p className="text-[0.95rem] leading-6 text-foreground/90">
              {tContribute("flowPurposeBody")}
            </p>
          </header>
          <ol
            className="grid gap-3 sm:grid-cols-2"
            aria-label={tContribute("flowPurposeTitle")}
          >
            {flowPurposeSteps.map((step, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-semibold text-primary"
                >
                  {index + 1}
                </span>
                <p className="text-[0.875rem] leading-5 text-foreground/90">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </section>
        {/*
         * `useSearchParams` triggers a client-side bailout when used without
         * a Suspense boundary under `output: "export"`. The ContributorWizard
         * reads `action=` / `id=` from the URL, so it must sit inside this
         * boundary to keep the page statically prerenderable for every locale.
         */}
        <Suspense fallback={null}>
          <ContributorWizard
            locale={locale}
            skills={[...generatedSkills]}
            labels={labels}
          />
        </Suspense>
      </div>
    </AppShell>
  );
}
