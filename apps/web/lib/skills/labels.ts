import type { GeneratedSkill } from "@/lib/skills/generated";
import type { SkillStatus } from "@/components/ui/status-badge";

export type CategoryLabelKey =
  | "categorySaudi"
  | "categoryCompliance"
  | "categorySecurity"
  | "categoryArchitecture";

export type StatusLabelKey =
  | "statusReviewed"
  | "statusCommunity"
  | "statusDraft";

export function mapStatus(status: GeneratedSkill["status"]): SkillStatus {
  switch (status) {
    case "maintainer-reviewed":
      return "reviewed";
    case "community-maintained":
      return "community";
    case "draft":
    default:
      return "draft";
  }
}

export function statusLabelKey(status: SkillStatus): StatusLabelKey {
  switch (status) {
    case "reviewed":
      return "statusReviewed";
    case "community":
      return "statusCommunity";
    case "draft":
    default:
      return "statusDraft";
  }
}

export function resolveCategoryLabelKey(
  skill: Pick<GeneratedSkill, "category" | "region">,
): CategoryLabelKey {
  if (skill.region === "saudi-arabia") return "categorySaudi";
  switch (skill.category) {
    case "compliance":
      return "categoryCompliance";
    case "security":
      return "categorySecurity";
    case "architecture":
    default:
      return "categoryArchitecture";
  }
}
