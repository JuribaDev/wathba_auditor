import { describe, expect, it } from "vitest";

import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

type Catalog = Record<string, unknown>;

function collectKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("messages catalog parity", () => {
  it("en and ar catalogs share the same key structure", () => {
    const enKeys = collectKeys(enMessages).sort();
    const arKeys = collectKeys(arMessages).sort();
    expect(arKeys).toEqual(enKeys);
  });

  it("every leaf string is non-empty in both catalogs", () => {
    function walk(a: unknown, b: unknown, path: string): void {
      if (typeof a === "string" || typeof b === "string") {
        expect(typeof a, `en missing string at ${path}`).toBe("string");
        expect(typeof b, `ar missing string at ${path}`).toBe("string");
        expect((a as string).length, `en empty at ${path}`).toBeGreaterThan(0);
        expect((b as string).length, `ar empty at ${path}`).toBeGreaterThan(0);
        return;
      }
      const aObj = (a ?? {}) as Catalog;
      const bObj = (b ?? {}) as Catalog;
      const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
      for (const key of keys) {
        walk(aObj[key], bObj[key], path ? `${path}.${key}` : key);
      }
    }
    walk(enMessages, arMessages, "");
  });

  it("covers the main product namespaces", () => {
    const required = [
      "Meta",
      "NotFound",
      "Shell",
      "Compare",
      "Landing",
      "Generate",
      "Questionnaire",
      "Skills",
      "SkillDetail",
    ];
    for (const namespace of required) {
      expect(enMessages, `en missing namespace ${namespace}`).toHaveProperty(namespace);
      expect(arMessages, `ar missing namespace ${namespace}`).toHaveProperty(namespace);
    }
  });
});
