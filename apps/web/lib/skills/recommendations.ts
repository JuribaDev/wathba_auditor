import type { GeneratedSkill } from "@/lib/skills/generated";
import { generatedSkills } from "@/lib/skills/generated";

export type Market = "ksa" | "gcc" | "global" | "other";
export type SecretsHandling = "manager" | "env" | "dotenv" | "none";
export type Stack =
  | "nodejs"
  | "dotnet"
  | "python"
  | "php"
  | "java"
  | "go"
  | "other";
export type TargetAgent = "claude-code" | "cursor" | "codex" | "agents-md";

export type QuestionnaireAnswers = {
  market?: Market;
  invoicing?: boolean;
  pii?: boolean;
  identity?: boolean;
  payments?: boolean;
  stack?: Stack;
  agents?: TargetAgent[];
  ci?: boolean;
  secrets?: SecretsHandling;
};

export const RECOMMENDABLE_SLUGS = [
  "zatca-phase2",
  "pdpl-basics",
  "nafath-yakeen-basics",
  "mada-stcpay-basics",
  "secrets-baseline",
  "auth-isolation",
  "testability-check",
  "ci-hygiene",
] as const;

export type RecommendableSlug = (typeof RECOMMENDABLE_SLUGS)[number];

type RecommendationBucket = "saudi" | "security" | "architecture";

const SLUG_BUCKETS: Record<RecommendableSlug, RecommendationBucket> = {
  "zatca-phase2": "saudi",
  "pdpl-basics": "saudi",
  "nafath-yakeen-basics": "saudi",
  "mada-stcpay-basics": "saudi",
  "secrets-baseline": "security",
  "auth-isolation": "security",
  "testability-check": "architecture",
  "ci-hygiene": "architecture",
};

const BUCKET_ORDER: Record<RecommendationBucket, number> = {
  saudi: 0,
  security: 1,
  architecture: 2,
};

export function recommendSkillSlugs(
  answers: QuestionnaireAnswers | undefined | null,
): RecommendableSlug[] {
  const a = answers ?? {};
  const ksa = a.market === "ksa" || a.market === "gcc";
  const rec = new Set<RecommendableSlug>();

  if (ksa && a.invoicing) rec.add("zatca-phase2");
  if (ksa && a.pii) rec.add("pdpl-basics");
  if (ksa && a.identity) rec.add("nafath-yakeen-basics");
  if (ksa && a.payments) rec.add("mada-stcpay-basics");

  if (a.secrets && a.secrets !== "manager") rec.add("secrets-baseline");
  if (a.identity || a.pii) rec.add("auth-isolation");
  if (!a.ci) rec.add("ci-hygiene");
  rec.add("testability-check");

  return [...rec].sort(
    (x, y) => BUCKET_ORDER[SLUG_BUCKETS[x]] - BUCKET_ORDER[SLUG_BUCKETS[y]],
  );
}

export function recommendSkills(
  answers: QuestionnaireAnswers | undefined | null,
  catalog: GeneratedSkill[] = generatedSkills,
): GeneratedSkill[] {
  const slugs = recommendSkillSlugs(answers);
  const bySlug = new Map<string, GeneratedSkill>();
  // Archived skills are opt-in only — they must not leak into default
  // recommendation flows. Deprecated skills are still recommended so
  // reviewers can see the replacement pointer in the UI.
  for (const skill of catalog) {
    if (skill.lifecycle === "archived") continue;
    bySlug.set(skill.slug, skill);
  }
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((skill): skill is GeneratedSkill => Boolean(skill));
}

export function isRecommendableSlug(value: string): value is RecommendableSlug {
  return (RECOMMENDABLE_SLUGS as readonly string[]).includes(value);
}
