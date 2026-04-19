"use client";

import { Moon, Sun } from "lucide-react";

import { useDocumentState } from "@/components/document-state-provider";
import { cn } from "@/lib/utils";
import {
  PRIMARY_SWATCHES,
  THEMES,
  type PrimarySwatch,
  type Theme,
} from "@/lib/document-state";

export type ThemeControlsLabels = {
  themeGroupLabel: string;
  themeLight: string;
  themeDark: string;
  primaryGroupLabel: string;
  primaryDefault: string;
  primaryInk: string;
  primaryOlive: string;
  primarySlate: string;
};

const SWATCH_PREVIEW: Record<PrimarySwatch, string> = {
  default: "#8F4B24",
  ink: "#2E4A6B",
  olive: "#5C6A36",
  slate: "#3A3A3A",
};

function swatchLabel(
  swatch: PrimarySwatch,
  labels: ThemeControlsLabels,
): string {
  switch (swatch) {
    case "default":
      return labels.primaryDefault;
    case "ink":
      return labels.primaryInk;
    case "olive":
      return labels.primaryOlive;
    case "slate":
      return labels.primarySlate;
  }
}

function themeLabel(theme: Theme, labels: ThemeControlsLabels): string {
  return theme === "dark" ? labels.themeDark : labels.themeLight;
}

export function ThemeToggle({
  labels,
  className,
}: {
  labels: ThemeControlsLabels;
  className?: string;
}) {
  const { theme, setTheme } = useDocumentState();

  return (
    <div
      role="radiogroup"
      aria-label={labels.themeGroupLabel}
      className={cn(
        "flex items-center gap-1 rounded-lg border border-border/80 bg-card p-1",
        className,
      )}
    >
      {THEMES.map((value) => {
        const isActive = theme === value;
        const Icon = value === "dark" ? Moon : Sun;
        const label = themeLabel(value, labels);
        return (
          <button
            type="button"
            key={value}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",
              "focus-visible:ring-offset-card",
              isActive
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export function PrimarySwatchPicker({
  labels,
  className,
}: {
  labels: ThemeControlsLabels;
  className?: string;
}) {
  const { primary, setPrimary } = useDocumentState();

  return (
    <div
      role="radiogroup"
      aria-label={labels.primaryGroupLabel}
      className={cn(
        "flex items-center gap-1 rounded-lg border border-border/80 bg-card p-1",
        className,
      )}
    >
      {PRIMARY_SWATCHES.map((value) => {
        const isActive = primary === value;
        const label = swatchLabel(value, labels);
        return (
          <button
            type="button"
            key={value}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setPrimary(value)}
            data-swatch={value}
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-full outline-none",
              "ring-offset-card transition-shadow",
              "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2",
              isActive
                ? "ring-2 ring-foreground/70 ring-offset-2"
                : "hover:ring-1 hover:ring-border-strong",
            )}
          >
            <span
              aria-hidden="true"
              className="block size-4 rounded-full"
              style={{ backgroundColor: SWATCH_PREVIEW[value] }}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ThemeControls({
  labels,
  className,
}: {
  labels: ThemeControlsLabels;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ThemeToggle labels={labels} />
      <PrimarySwatchPicker labels={labels} />
    </div>
  );
}
