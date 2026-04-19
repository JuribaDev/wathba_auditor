import type { GeneratedSkill } from "@/lib/skills/generated";

export const CATEGORY_FILTERS = ["all", "saudi", "security", "architecture"] as const;
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export const STATUS_FILTERS = ["all", "reviewed", "community", "draft"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function matchesCategory(skill: GeneratedSkill, filter: CategoryFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "saudi":
      return skill.region === "saudi-arabia";
    case "security":
      return skill.category === "security";
    case "architecture":
      return skill.category === "architecture";
    default:
      return true;
  }
}

export function matchesStatus(skill: GeneratedSkill, filter: StatusFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "reviewed":
      return skill.status === "maintainer-reviewed";
    case "community":
      return skill.status === "community-maintained";
    case "draft":
      return skill.status === "draft";
    default:
      return true;
  }
}

export function filterSkills(
  skills: readonly GeneratedSkill[],
  category: CategoryFilter,
  status: StatusFilter,
): GeneratedSkill[] {
  return skills.filter((skill) => matchesCategory(skill, category) && matchesStatus(skill, status));
}
