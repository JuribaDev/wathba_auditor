import { generatedSkills, generatedSkillsById, type GeneratedSkill } from "@/lib/skills/generated";
import type { AppLocale } from "@/lib/i18n";

export function listSkills() {
  return generatedSkills;
}

export function findSkillById(id: string) {
  return generatedSkillsById[id];
}

export function getSkillName(skill: GeneratedSkill, locale: AppLocale) {
  return skill.name[locale];
}

