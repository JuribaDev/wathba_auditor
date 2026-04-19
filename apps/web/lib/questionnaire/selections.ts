import type { GeneratedSkill } from "@/lib/skills/generated";

export type SelectionSource = "auto" | "manual";

export type Selection = {
  on: boolean;
  source: SelectionSource;
};

export type Selections = Record<string, Selection>;

export const SELECTION_SOURCES: ReadonlySet<SelectionSource> = new Set<SelectionSource>([
  "auto",
  "manual",
]);

export function isSelectionSource(value: unknown): value is SelectionSource {
  return typeof value === "string" && SELECTION_SOURCES.has(value as SelectionSource);
}

export function toggleSelection(
  prev: Selections,
  skillId: string,
  fallbackSource: SelectionSource,
): Selections {
  const existing = prev[skillId];
  if (existing) {
    return { ...prev, [skillId]: { ...existing, on: !existing.on } };
  }
  return { ...prev, [skillId]: { on: true, source: fallbackSource } };
}

export function addManualSelection(
  prev: Selections,
  skillId: string,
): Selections {
  const existing = prev[skillId];
  if (existing) {
    return { ...prev, [skillId]: { ...existing, on: true } };
  }
  return { ...prev, [skillId]: { on: true, source: "manual" } };
}

export function seedAutoRecommendations(
  prev: Selections,
  recommendations: readonly { id: string }[],
): Selections {
  const next: Selections = { ...prev };
  let mutated = false;
  for (const skill of recommendations) {
    if (!next[skill.id]) {
      next[skill.id] = { on: true, source: "auto" };
      mutated = true;
    }
  }
  return mutated ? next : prev;
}

export type ReviewRow = {
  skill: GeneratedSkill;
  on: boolean;
  source: SelectionSource;
};

export function buildReviewRows(
  recommendations: readonly GeneratedSkill[],
  manualSkills: readonly GeneratedSkill[],
  selections: Selections,
): ReviewRow[] {
  const rows: ReviewRow[] = [];
  for (const skill of recommendations) {
    const selection = selections[skill.id];
    rows.push({
      skill,
      on: selection?.on ?? true,
      source: selection?.source ?? "auto",
    });
  }
  for (const skill of manualSkills) {
    const selection = selections[skill.id];
    rows.push({
      skill,
      on: selection?.on ?? true,
      source: selection?.source ?? "manual",
    });
  }
  return rows;
}

export function partitionLibraryForReview(
  catalog: readonly GeneratedSkill[],
  recommendations: readonly GeneratedSkill[],
  selections: Selections,
): { manualSkills: GeneratedSkill[]; availableSkills: GeneratedSkill[] } {
  const recommendationIds = new Set(recommendations.map((skill) => skill.id));
  const manualSkills: GeneratedSkill[] = [];
  const availableSkills: GeneratedSkill[] = [];
  for (const skill of catalog) {
    if (recommendationIds.has(skill.id)) continue;
    if (selections[skill.id]?.source === "manual") {
      manualSkills.push(skill);
    } else {
      availableSkills.push(skill);
    }
  }
  return { manualSkills, availableSkills };
}
