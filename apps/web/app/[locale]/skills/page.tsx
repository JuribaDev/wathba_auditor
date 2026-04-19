import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SkillLibrary } from "@/components/skill-library";
import { isLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";
import { generatedSkills } from "@/lib/skills/generated";

type SkillsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SkillsPage({ params }: SkillsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslator(locale, "Skills");

  return (
    <AppShell locale={locale} section="skills" title={t("title")} description={t("description")}>
      <SkillLibrary
        locale={locale}
        skills={generatedSkills}
        labels={{
          categoryLegend: t("filterCategoryLegend"),
          statusLegend: t("filterStatusLegend"),
          empty: t("empty"),
          viewSkill: t("viewSkill"),
          category: {
            all: t("filterCategoryAll"),
            saudi: t("filterCategorySaudi"),
            security: t("filterCategorySecurity"),
            architecture: t("filterCategoryArchitecture"),
          },
          status: {
            all: t("filterStatusAll"),
            reviewed: t("filterStatusReviewed"),
            community: t("filterStatusCommunity"),
            draft: t("filterStatusDraft"),
          },
          cardMeta: {
            category: {
              categorySaudi: t("filterCategorySaudi"),
              categoryCompliance: t("cardCategoryCompliance"),
              categorySecurity: t("filterCategorySecurity"),
              categoryArchitecture: t("filterCategoryArchitecture"),
            },
            status: {
              statusReviewed: t("filterStatusReviewed"),
              statusCommunity: t("filterStatusCommunity"),
              statusDraft: t("filterStatusDraft"),
            },
            disclaimer: t("cardDisclaimerLabel"),
            disclaimerTitle: t("cardDisclaimerTitle"),
            versionPrefix: t("cardVersionPrefix"),
            verifiedPrefix: t("cardVerifiedPrefix"),
          },
        }}
      />
    </AppShell>
  );
}
