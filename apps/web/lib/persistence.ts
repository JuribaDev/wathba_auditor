import type { ReviewSelections } from "@/components/questionnaire/step-review";
import {
  isQuestionnaireStepId,
  type QuestionnaireStepId,
} from "@/lib/questionnaire/steps";
import type {
  VariableValue,
  VariableValues,
} from "@/lib/questionnaire/variables";
import type { QuestionnaireAnswers } from "@/lib/skills/recommendations";

export const STORAGE_KEYS = {
  route: "wathbaSkills.route",
  answers: "wathbaSkills.answers",
} as const;

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    const probe = "__wathba_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export type PersistedQuestionnaireState = {
  answers: QuestionnaireAnswers;
  selections: ReviewSelections;
  variableValues: VariableValues;
  attemptedSteps: QuestionnaireStepId[];
  seededRecommendations: boolean;
};

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const MARKETS = new Set(["ksa", "gcc", "global", "other"]);
const STACKS = new Set([
  "nodejs",
  "dotnet",
  "python",
  "php",
  "java",
  "go",
  "other",
]);
const AGENTS = new Set(["claude-code", "cursor", "codex", "agents-md"]);
const SECRETS = new Set(["manager", "env", "dotenv", "none"]);
const SELECTION_SOURCES = new Set(["auto", "manual"]);

function sanitizeAnswers(input: unknown): QuestionnaireAnswers {
  if (!isPlainObject(input)) return {};
  const out: QuestionnaireAnswers = {};
  if (typeof input.market === "string" && MARKETS.has(input.market)) {
    out.market = input.market as QuestionnaireAnswers["market"];
  }
  if (typeof input.invoicing === "boolean") out.invoicing = input.invoicing;
  if (typeof input.pii === "boolean") out.pii = input.pii;
  if (typeof input.identity === "boolean") out.identity = input.identity;
  if (typeof input.payments === "boolean") out.payments = input.payments;
  if (typeof input.stack === "string" && STACKS.has(input.stack)) {
    out.stack = input.stack as QuestionnaireAnswers["stack"];
  }
  if (Array.isArray(input.agents)) {
    const unique = new Set<string>();
    for (const entry of input.agents) {
      if (typeof entry === "string" && AGENTS.has(entry)) {
        unique.add(entry);
      }
    }
    if (unique.size > 0) {
      out.agents = [...unique] as QuestionnaireAnswers["agents"];
    }
  }
  if (typeof input.ci === "boolean") out.ci = input.ci;
  if (typeof input.secrets === "string" && SECRETS.has(input.secrets)) {
    out.secrets = input.secrets as QuestionnaireAnswers["secrets"];
  }
  return out;
}

function sanitizeSelections(input: unknown): ReviewSelections {
  if (!isPlainObject(input)) return {};
  const out: ReviewSelections = {};
  for (const [key, raw] of Object.entries(input)) {
    if (!isPlainObject(raw)) continue;
    if (typeof raw.on !== "boolean") continue;
    if (typeof raw.source !== "string" || !SELECTION_SOURCES.has(raw.source)) {
      continue;
    }
    out[key] = {
      on: raw.on,
      source: raw.source as "auto" | "manual",
    };
  }
  return out;
}

function sanitizeVariableValues(input: unknown): VariableValues {
  if (!isPlainObject(input)) return {};
  const out: VariableValues = {};
  for (const [key, raw] of Object.entries(input)) {
    if (typeof raw === "string" || typeof raw === "boolean") {
      out[key] = raw as VariableValue;
    }
  }
  return out;
}

function sanitizeAttemptedSteps(input: unknown): QuestionnaireStepId[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<QuestionnaireStepId>();
  for (const entry of input) {
    if (isQuestionnaireStepId(entry)) seen.add(entry);
  }
  return [...seen];
}

export function loadQuestionnaireRoute(
  storage: StorageLike | null = getBrowserStorage(),
): QuestionnaireStepId | null {
  if (!storage) return null;
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEYS.route);
  } catch {
    return null;
  }
  if (!raw) return null;
  return isQuestionnaireStepId(raw) ? raw : null;
}

export function saveQuestionnaireRoute(
  step: QuestionnaireStepId,
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.route, step);
  } catch {
    // Quota or permission errors are non-fatal — persistence is best-effort.
  }
}

export function loadQuestionnaireState(
  storage: StorageLike | null = getBrowserStorage(),
): PersistedQuestionnaireState | null {
  if (!storage) return null;
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEYS.answers);
  } catch {
    return null;
  }
  if (!raw) return null;
  const parsed = safeParse(raw);
  if (!isPlainObject(parsed)) return null;
  return {
    answers: sanitizeAnswers(parsed.answers),
    selections: sanitizeSelections(parsed.selections),
    variableValues: sanitizeVariableValues(parsed.variableValues),
    attemptedSteps: sanitizeAttemptedSteps(parsed.attemptedSteps),
    seededRecommendations: parsed.seededRecommendations === true,
  };
}

export function saveQuestionnaireState(
  state: PersistedQuestionnaireState,
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.answers, JSON.stringify(state));
  } catch {
    // Best-effort persistence.
  }
}

export function clearQuestionnaireState(
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEYS.route);
    storage.removeItem(STORAGE_KEYS.answers);
  } catch {
    // Best-effort.
  }
}
