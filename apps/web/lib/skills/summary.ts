import type { AppLocale } from "@/lib/i18n";
import type { GeneratedSkill } from "@/lib/skills/generated";

export function resolveSkillSummary(skill: GeneratedSkill, locale: AppLocale): string {
  const localizedSummary = skill.summary?.[locale];
  if (localizedSummary && localizedSummary.trim().length > 0) {
    return localizedSummary;
  }
  return (
    skill.body
      .split("\n")
      .find((line) => line.trim().length > 0 && !line.trim().startsWith("#")) ?? ""
  );
}
