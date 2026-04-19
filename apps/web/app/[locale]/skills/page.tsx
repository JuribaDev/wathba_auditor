import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SkillCard } from "@/components/skill-card";
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
      <section className="grid gap-4 md:grid-cols-2">
        {generatedSkills.map((skill) => (
          <SkillCard key={skill.id} locale={locale} skill={skill}>
            <Link href={`/${locale}/skills/${skill.id}`}>{t("viewSkill")}</Link>
          </SkillCard>
        ))}
      </section>
    </AppShell>
  );
}

