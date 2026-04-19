export const DOCUMENT_STATE_STORAGE_KEYS = {
  theme: "wathbaSkills.theme",
  primary: "wathbaSkills.primary",
} as const;

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const PRIMARY_SWATCHES = ["default", "ink", "olive", "slate"] as const;
export type PrimarySwatch = (typeof PRIMARY_SWATCHES)[number];

export const DEFAULT_THEME: Theme = "light";
export const DEFAULT_PRIMARY: PrimarySwatch = "default";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function isPrimarySwatch(value: unknown): value is PrimarySwatch {
  return (
    typeof value === "string" &&
    (PRIMARY_SWATCHES as readonly string[]).includes(value)
  );
}

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function getStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    const probe = "__wathba_doc_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function loadTheme(storage: StorageLike | null = getStorage()): Theme {
  if (!storage) return DEFAULT_THEME;
  try {
    const raw = storage.getItem(DOCUMENT_STATE_STORAGE_KEYS.theme);
    return isTheme(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function loadPrimary(
  storage: StorageLike | null = getStorage(),
): PrimarySwatch {
  if (!storage) return DEFAULT_PRIMARY;
  try {
    const raw = storage.getItem(DOCUMENT_STATE_STORAGE_KEYS.primary);
    return isPrimarySwatch(raw) ? raw : DEFAULT_PRIMARY;
  } catch {
    return DEFAULT_PRIMARY;
  }
}

export function saveTheme(
  theme: Theme,
  storage: StorageLike | null = getStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(DOCUMENT_STATE_STORAGE_KEYS.theme, theme);
  } catch {
    // Best-effort.
  }
}

export function savePrimary(
  primary: PrimarySwatch,
  storage: StorageLike | null = getStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(DOCUMENT_STATE_STORAGE_KEYS.primary, primary);
  } catch {
    // Best-effort.
  }
}

/**
 * Synchronous script injected before React hydration. Reads persisted theme +
 * primary from localStorage and writes them onto <html> so CSS tokens resolve
 * correctly on the first paint, avoiding a flash of the server default.
 */
export function buildDocumentStateInitScript(): string {
  return `(() => {
  try {
    var root = document.documentElement;
    var themes = ${JSON.stringify(THEMES)};
    var primaries = ${JSON.stringify(PRIMARY_SWATCHES)};
    var theme = null;
    var primary = null;
    try {
      theme = localStorage.getItem(${JSON.stringify(DOCUMENT_STATE_STORAGE_KEYS.theme)});
    } catch (e) {}
    try {
      primary = localStorage.getItem(${JSON.stringify(DOCUMENT_STATE_STORAGE_KEYS.primary)});
    } catch (e) {}
    if (themes.indexOf(theme) === -1) theme = ${JSON.stringify(DEFAULT_THEME)};
    if (primaries.indexOf(primary) === -1) primary = ${JSON.stringify(DEFAULT_PRIMARY)};
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-primary", primary);
  } catch (e) {}
})();`;
}
