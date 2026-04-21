import { notFound } from "next/navigation";

import { AddSkillCta } from "@/components/add-skill-cta";
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
    <AppShell
      locale={locale}
      section="skills"
      title={t("title")}
      description={t("description")}
      actions={
        <AddSkillCta
          locale={locale}
          eyebrow={t("addNewSkillEyebrow")}
          label={t("addNewSkillCta")}
          helper={t("addNewSkillHelp")}
        />
      }
    >
      <SkillLibrary
        locale={locale}
        skills={generatedSkills}
        labels={{
          categoryLegend: t("filterCategoryLegend"),
          statusLegend: t("filterStatusLegend"),
          lifecycleLegend: t("lifecycleLegend"),
          empty: t("empty"),
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
          lifecycle: {
            default: t("lifecycleDefault"),
            active: t("lifecycleActive"),
            deprecated: t("lifecycleDeprecated"),
            archived: t("lifecycleArchived"),
            all: t("lifecycleAll"),
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
            viewSkill: t("viewSkill"),
            lifecycleDeprecated: t("lifecycleBadgeDeprecated"),
            lifecycleArchived: t("lifecycleBadgeArchived"),
            lifecycleDeprecatedShort: t("lifecycleDeprecatedShort"),
            lifecycleArchivedShort: t("lifecycleArchivedShort"),
          },
        }}
      />
    </AppShell>
  );
}
