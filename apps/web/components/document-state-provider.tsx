"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_PRIMARY,
  DEFAULT_THEME,
  isPrimarySwatch,
  isTheme,
  loadPrimary,
  loadTheme,
  savePrimary,
  saveTheme,
  type PrimarySwatch,
  type Theme,
} from "@/lib/document-state";

type DocumentStateContextValue = {
  theme: Theme;
  primary: PrimarySwatch;
  setTheme: (theme: Theme) => void;
  setPrimary: (primary: PrimarySwatch) => void;
  toggleTheme: () => void;
};

const DocumentStateContext = createContext<DocumentStateContextValue | null>(
  null,
);

function readInitialFromDocument(): { theme: Theme; primary: PrimarySwatch } {
  if (typeof document === "undefined") {
    return { theme: DEFAULT_THEME, primary: DEFAULT_PRIMARY };
  }
  const root = document.documentElement;
  const rawTheme = root.getAttribute("data-theme");
  const rawPrimary = root.getAttribute("data-primary");
  return {
    theme: isTheme(rawTheme) ? rawTheme : loadTheme(),
    primary: isPrimarySwatch(rawPrimary) ? rawPrimary : loadPrimary(),
  };
}

export function DocumentStateProvider({ children }: { children: ReactNode }) {
  // Start from the server default so SSR and first-client-render agree. The
  // pre-hydration script in the locale layout has already written the
  // persisted values onto <html>, so swapping state to match in the mount
  // effect keeps React in sync without re-applying attributes unnecessarily.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [primary, setPrimaryState] = useState<PrimarySwatch>(DEFAULT_PRIMARY);

  useEffect(() => {
    const initial = readInitialFromDocument();
    // One-shot hydration of React state from the attributes the
    // pre-hydration init script has already written to <html>. React batches
    // these.
    /* eslint-disable react-hooks/set-state-in-effect */
    setThemeState(initial.theme);
    setPrimaryState(initial.primary);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
    saveTheme(next);
  }, []);

  const setPrimary = useCallback((next: PrimarySwatch) => {
    setPrimaryState(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-primary", next);
    }
    savePrimary(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo<DocumentStateContextValue>(
    () => ({ theme, primary, setTheme, setPrimary, toggleTheme }),
    [theme, primary, setTheme, setPrimary, toggleTheme],
  );

  return (
    <DocumentStateContext.Provider value={value}>
      {children}
    </DocumentStateContext.Provider>
  );
}

export function useDocumentState(): DocumentStateContextValue {
  const ctx = useContext(DocumentStateContext);
  if (!ctx) {
    throw new Error(
      "useDocumentState must be used inside a DocumentStateProvider",
    );
  }
  return ctx;
}
