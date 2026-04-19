"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CompareScreenId =
  | "landing"
  | "questionnaire"
  | "review"
  | "generate"
  | "detail";

export type CompareScreenDescriptor = {
  id: CompareScreenId;
  label: string;
};

export type CompareFrameBundle = {
  lang: "en" | "ar";
  dir: "ltr" | "rtl";
  frameLabel: string;
  frameSlug: string;
  screens: Record<CompareScreenId, ReactNode>;
};

type CompareCanvasProps = {
  screens: CompareScreenDescriptor[];
  frames: CompareFrameBundle[];
  tabsAriaLabel: string;
  initialScreen?: CompareScreenId;
};

export function CompareCanvas({
  screens,
  frames,
  tabsAriaLabel,
  initialScreen = "landing",
}: CompareCanvasProps) {
  const [active, setActive] = useState<CompareScreenId>(initialScreen);

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={tabsAriaLabel}
        className="inline-flex flex-wrap items-center gap-1 self-start rounded-full border border-border bg-surface p-1 shadow-[var(--shadow-sm)]"
      >
        {screens.map((screen) => {
          const isActive = screen.id === active;
          return (
            <button
              key={screen.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`compare-panel-${screen.id}`}
              id={`compare-tab-${screen.id}`}
              onClick={() => setActive(screen.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {screen.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {frames.map((frame) => (
          <section
            key={frame.lang}
            role="tabpanel"
            id={`compare-panel-${active}-${frame.lang}`}
            aria-labelledby={`compare-tab-${active}`}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)]"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border bg-surface-variant px-5 py-2.5 text-xs text-muted-foreground">
              <span className="font-medium tracking-wide">
                {frame.frameLabel}
              </span>
              <span className="font-mono">{frame.frameSlug}</span>
            </header>
            <div
              lang={frame.lang}
              dir={frame.dir}
              data-compare-frame={frame.lang}
              className="min-h-[560px] bg-background px-6 py-7 text-foreground"
            >
              {frame.screens[active]}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
