import type { GeneratedSkill } from "@/lib/skills/generated";

export const CATEGORY_FILTERS = ["all", "saudi", "security", "architecture"] as const;
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export const STATUS_FILTERS = ["all", "reviewed", "community", "draft"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

// Lifecycle filter for the library — default hides archived skills from normal
// discovery. `active`/`deprecated` are chosen together for the default view so
// deprecated skills stay visible with deprecation guidance until a maintainer
// archives them.
export const LIFECYCLE_FILTERS = [
  "default",
  "active",
  "deprecated",
  "archived",
  "all",
] as const;
export type LifecycleFilter = (typeof LIFECYCLE_FILTERS)[number];

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

export function matchesLifecycle(
  skill: GeneratedSkill,
  filter: LifecycleFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "default":
      return skill.lifecycle !== "archived";
    case "active":
      return skill.lifecycle === "active";
    case "deprecated":
      return skill.lifecycle === "deprecated";
    case "archived":
      return skill.lifecycle === "archived";
    default:
      return true;
  }
}

// Consumers without an explicit lifecycle filter get the "default" view —
// active + deprecated, but no archived. Archived skills should always be an
// opt-in surface (filters, contributor tools) so they don't surprise readers.
export function filterSkills(
  skills: readonly GeneratedSkill[],
  category: CategoryFilter,
  status: StatusFilter,
  lifecycle: LifecycleFilter = "default",
): GeneratedSkill[] {
  return skills.filter(
    (skill) =>
      matchesCategory(skill, category) &&
      matchesStatus(skill, status) &&
      matchesLifecycle(skill, lifecycle),
  );
}
