import { describe, expect, it } from "vitest";

import {
  STORAGE_KEYS,
  clearQuestionnaireState,
  loadQuestionnaireRoute,
  loadQuestionnaireState,
  saveQuestionnaireRoute,
  saveQuestionnaireState,
  type PersistedQuestionnaireState,
  type StorageLike,
} from "@/lib/persistence";

function makeStorage(): StorageLike & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

const FULL_STATE: PersistedQuestionnaireState = {
  answers: {
    market: "ksa",
    pii: true,
    invoicing: true,
    payments: false,
    identity: true,
    stack: "nodejs",
    agents: ["claude-code", "cursor"],
    ci: true,
    secrets: "manager",
  },
  selections: {
    "zatca-phase2": { on: true, source: "auto" },
    "pdpl-basics": { on: false, source: "manual" },
  },
  variableValues: {
    "zatca-phase2.stack": "nodejs",
    "pdpl-basics.collectsIds": true,
  },
  attemptedSteps: ["about", "tech"],
  seededRecommendations: true,
};

describe("questionnaire route persistence", () => {
  it("round-trips a valid step", () => {
    const storage = makeStorage();
    saveQuestionnaireRoute("review", storage);
    expect(storage.store.get(STORAGE_KEYS.route)).toBe("review");
    expect(loadQuestionnaireRoute(storage)).toBe("review");
  });

  it("returns null when no value is stored", () => {
    const storage = makeStorage();
    expect(loadQuestionnaireRoute(storage)).toBeNull();
  });

  it("returns null for an unrecognized step id", () => {
    const storage = makeStorage();
    storage.setItem(STORAGE_KEYS.route, "nope");
    expect(loadQuestionnaireRoute(storage)).toBeNull();
  });

  it("returns null when no storage is available", () => {
    expect(loadQuestionnaireRoute(null)).toBeNull();
  });
});

describe("questionnaire state persistence", () => {
  it("round-trips a fully populated state", () => {
    const storage = makeStorage();
    saveQuestionnaireState(FULL_STATE, storage);
    const loaded = loadQuestionnaireState(storage);
    expect(loaded).toEqual(FULL_STATE);
  });

  it("returns null when the stored value is malformed JSON", () => {
    const storage = makeStorage();
    storage.setItem(STORAGE_KEYS.answers, "{not json");
    expect(loadQuestionnaireState(storage)).toBeNull();
  });

  it("returns null when the stored value is not a plain object", () => {
    const storage = makeStorage();
    storage.setItem(STORAGE_KEYS.answers, JSON.stringify(["array"]));
    expect(loadQuestionnaireState(storage)).toBeNull();
  });

  it("drops fields with unknown or invalid values", () => {
    const storage = makeStorage();
    storage.setItem(
      STORAGE_KEYS.answers,
      JSON.stringify({
        answers: {
          market: "mars",
          pii: "yes",
          stack: "rust",
          agents: ["claude-code", "unknown", 42],
          secrets: "env",
        },
        selections: {
          good: { on: true, source: "auto" },
          missingOn: { source: "auto" },
          wrongSource: { on: true, source: "???" },
        },
        variableValues: {
          a: "ok",
          b: true,
          c: 42,
          d: { nested: true },
        },
        attemptedSteps: ["about", "not-a-step", "tech"],
        seededRecommendations: "truthy",
      }),
    );
    const loaded = loadQuestionnaireState(storage);
    expect(loaded).not.toBeNull();
    expect(loaded!.answers).toEqual({
      agents: ["claude-code"],
      secrets: "env",
    });
    expect(loaded!.selections).toEqual({
      good: { on: true, source: "auto" },
    });
    expect(loaded!.variableValues).toEqual({ a: "ok", b: true });
    expect(loaded!.attemptedSteps).toEqual(["about", "tech"]);
    expect(loaded!.seededRecommendations).toBe(false);
  });

  it("returns null when no storage is available", () => {
    expect(loadQuestionnaireState(null)).toBeNull();
  });
});

describe("clearQuestionnaireState", () => {
  it("removes both keys from storage", () => {
    const storage = makeStorage();
    saveQuestionnaireRoute("tech", storage);
    saveQuestionnaireState(FULL_STATE, storage);
    clearQuestionnaireState(storage);
    expect(storage.store.has(STORAGE_KEYS.route)).toBe(false);
    expect(storage.store.has(STORAGE_KEYS.answers)).toBe(false);
  });

  it("is a no-op when no storage is available", () => {
    expect(() => clearQuestionnaireState(null)).not.toThrow();
  });
});
