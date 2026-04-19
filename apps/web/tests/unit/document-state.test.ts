import vm from "node:vm";
import { describe, expect, it } from "vitest";

import {
  buildDocumentStateInitScript,
  DEFAULT_PRIMARY,
  DEFAULT_THEME,
  DOCUMENT_STATE_STORAGE_KEYS,
  isPrimarySwatch,
  isTheme,
  loadPrimary,
  loadTheme,
  PRIMARY_SWATCHES,
  savePrimary,
  saveTheme,
  THEMES,
} from "@/lib/document-state";

function makeStorage(seed: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

function runInitScriptWith(sandbox: {
  document: { documentElement: { setAttribute: (k: string, v: string) => void } };
  localStorage: { getItem: (key: string) => string | null };
}) {
  const context = vm.createContext(sandbox);
  vm.runInContext(buildDocumentStateInitScript(), context);
}

describe("document-state validators", () => {
  it("accepts only known themes", () => {
    for (const theme of THEMES) {
      expect(isTheme(theme)).toBe(true);
    }
    expect(isTheme("sepia")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });

  it("accepts only known primary swatches", () => {
    for (const primary of PRIMARY_SWATCHES) {
      expect(isPrimarySwatch(primary)).toBe(true);
    }
    expect(isPrimarySwatch("rose")).toBe(false);
    expect(isPrimarySwatch(42)).toBe(false);
  });

  it("defaults align with the PRD", () => {
    expect(DEFAULT_THEME).toBe("light");
    expect(DEFAULT_PRIMARY).toBe("default");
  });
});

describe("document-state persistence", () => {
  it("returns defaults when storage is empty or absent", () => {
    expect(loadTheme(null)).toBe(DEFAULT_THEME);
    expect(loadPrimary(null)).toBe(DEFAULT_PRIMARY);
    expect(loadTheme(makeStorage())).toBe(DEFAULT_THEME);
    expect(loadPrimary(makeStorage())).toBe(DEFAULT_PRIMARY);
  });

  it("round-trips a valid theme + primary", () => {
    const storage = makeStorage();
    saveTheme("dark", storage);
    savePrimary("olive", storage);
    expect(loadTheme(storage)).toBe("dark");
    expect(loadPrimary(storage)).toBe("olive");
  });

  it("falls back to default when persisted value is invalid", () => {
    const storage = makeStorage({
      [DOCUMENT_STATE_STORAGE_KEYS.theme]: "neon",
      [DOCUMENT_STATE_STORAGE_KEYS.primary]: "magenta",
    });
    expect(loadTheme(storage)).toBe(DEFAULT_THEME);
    expect(loadPrimary(storage)).toBe(DEFAULT_PRIMARY);
  });

  it("no-ops save when storage is null", () => {
    expect(() => saveTheme("dark", null)).not.toThrow();
    expect(() => savePrimary("ink", null)).not.toThrow();
  });
});

describe("buildDocumentStateInitScript", () => {
  it("hydrates documentElement with persisted values when present", () => {
    const attrs: Record<string, string> = {};
    runInitScriptWith({
      document: {
        documentElement: {
          setAttribute(name, value) {
            attrs[name] = value;
          },
        },
      },
      localStorage: {
        getItem(key) {
          if (key === DOCUMENT_STATE_STORAGE_KEYS.theme) return "dark";
          if (key === DOCUMENT_STATE_STORAGE_KEYS.primary) return "ink";
          return null;
        },
      },
    });
    expect(attrs["data-theme"]).toBe("dark");
    expect(attrs["data-primary"]).toBe("ink");
  });

  it("falls back to defaults when localStorage throws", () => {
    const attrs: Record<string, string> = {};
    runInitScriptWith({
      document: {
        documentElement: {
          setAttribute(name, value) {
            attrs[name] = value;
          },
        },
      },
      localStorage: {
        getItem() {
          throw new Error("blocked");
        },
      },
    });
    expect(attrs["data-theme"]).toBe(DEFAULT_THEME);
    expect(attrs["data-primary"]).toBe(DEFAULT_PRIMARY);
  });

  it("drops unknown stored values and uses defaults", () => {
    const attrs: Record<string, string> = {};
    runInitScriptWith({
      document: {
        documentElement: {
          setAttribute(name, value) {
            attrs[name] = value;
          },
        },
      },
      localStorage: {
        getItem(key) {
          if (key === DOCUMENT_STATE_STORAGE_KEYS.theme) return "sepia";
          if (key === DOCUMENT_STATE_STORAGE_KEYS.primary) return "neon";
          return null;
        },
      },
    });
    expect(attrs["data-theme"]).toBe(DEFAULT_THEME);
    expect(attrs["data-primary"]).toBe(DEFAULT_PRIMARY);
  });
});
