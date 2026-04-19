import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import {
  CompareCanvas,
  type CompareFrameBundle,
  type CompareScreenId,
} from "@/components/compare/compare-canvas";
import {
  CompareDetailScreen,
  CompareGenerateScreen,
  CompareLandingScreen,
  CompareQuestionnaireScreen,
  CompareReviewScreen,
} from "@/components/compare/compare-screens";
import type { AppLocale } from "@/lib/i18n";
import { isLocale, locales } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";
import { generatedSkills, type GeneratedSkill } from "@/lib/skills/generated";

type ComparePageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const REVIEW_SKILL_IDS = [
  "saudi-zatca-phase2",
  "saudi-pdpl-basics",
  "security-secrets-baseline",
] as const;

const DETAIL_SKILL_ID = "saudi-zatca-phase2";

function pickSkill(id: string): GeneratedSkill | undefined {
  return generatedSkills.find((skill) => skill.id === id);
}

function pickSkills(ids: readonly string[]): GeneratedSkill[] {
  return ids
    .map((id) => pickSkill(id))
    .filter((skill): skill is GeneratedSkill => Boolean(skill));
}

function buildTreeFromSkills(skills: GeneratedSkill[]) {
  const claudeItems = skills.map((skill) => `${skill.slug}/SKILL.md`);
  const cursorItems = skills.map((skill) => `${skill.slug}.mdc`);
  return [
    { folder: ".claude/skills/", items: claudeItems },
    { folder: ".cursor/rules/", items: cursorItems },
  ];
}

async function buildFrameBundle(lang: AppLocale): Promise<CompareFrameBundle> {
  const tCompare = await getTranslator(lang, "Compare");
  const tLanding = await getTranslator(lang, "Landing");
  const tQuestionnaire = await getTranslator(lang, "Questionnaire");
  const tSkills = await getTranslator(lang, "Skills");
  const tSkillDetail = await getTranslator(lang, "SkillDetail");

  const categoryLabels = {
    categorySaudi: tSkills("filterCategorySaudi"),
    categoryCompliance: tSkills("cardCategoryCompliance"),
    categorySecurity: tSkills("filterCategorySecurity"),
    categoryArchitecture: tSkills("filterCategoryArchitecture"),
  };
  const statusLabels = {
    statusReviewed: tSkills("filterStatusReviewed"),
    statusCommunity: tSkills("filterStatusCommunity"),
    statusDraft: tSkills("filterStatusDraft"),
  };

  const reviewSkills = pickSkills(REVIEW_SKILL_IDS);
  const detailSkill = pickSkill(DETAIL_SKILL_ID) ?? generatedSkills[0];
  const tree = buildTreeFromSkills(reviewSkills);

  const screens: Record<CompareScreenId, ReactNode> = {
    landing: <CompareLandingScreen lang={lang} tLanding={tLanding} />,
    questionnaire: (
      <CompareQuestionnaireScreen
        lang={lang}
        tQuestionnaire={tQuestionnaire}
      />
    ),
    review: (
      <CompareReviewScreen
        lang={lang}
        tQuestionnaire={tQuestionnaire}
        tCompare={tCompare}
        skills={reviewSkills}
        categoryLabels={categoryLabels}
        statusLabels={statusLabels}
      />
    ),
    generate: (
      <CompareGenerateScreen
        lang={lang}
        tQuestionnaire={tQuestionnaire}
        tCompare={tCompare}
        tree={tree}
      />
    ),
    detail: detailSkill ? (
      <CompareDetailScreen
        lang={lang}
        tCompare={tCompare}
        tSkillDetail={tSkillDetail}
        skill={detailSkill}
        categoryLabels={categoryLabels}
        statusLabels={statusLabels}
      />
    ) : null,
  };

  return {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    frameLabel:
      lang === "ar" ? tCompare("arFrame.title") : tCompare("enFrame.title"),
    frameSlug:
      lang === "ar" ? tCompare("frameLangSlugAr") : tCompare("frameLangSlugEn"),
    screens,
  };
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslator(locale, "Compare");

  const [enFrame, arFrame] = await Promise.all([
    buildFrameBundle("en"),
    buildFrameBundle("ar"),
  ]);

  const screens = [
    { id: "landing" as const, label: t("screenLandingLabel") },
    { id: "questionnaire" as const, label: t("screenQuestionnaireLabel") },
    { id: "review" as const, label: t("screenReviewLabel") },
    { id: "generate" as const, label: t("screenGenerateLabel") },
    { id: "detail" as const, label: t("screenDetailLabel") },
  ];

  return (
    <AppShell
      locale={locale}
      section="compare"
      title={t("canvasTitle")}
      description={t("canvasLede")}
    >
      <CompareCanvas
        screens={screens}
        frames={[enFrame, arFrame]}
        tabsAriaLabel={t("tabsGroupLabel")}
      />
    </AppShell>
  );
}
