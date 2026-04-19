"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { locales, swapLocaleInPath, type AppLocale } from "@/lib/i18n";

type LocaleSwitchLabels = {
  groupLabel: string;
  en: string;
  ar: string;
};

export function LocaleSwitch({
  locale,
  labels,
}: {
  locale: AppLocale;
  labels: LocaleSwitchLabels;
}) {
  const pathname = usePathname() ?? `/${locale}`;

  return (
    <nav
      aria-label={labels.groupLabel}
      className="flex items-center gap-2 rounded-lg border border-border/80 bg-card px-2 py-1"
    >
      {locales.map((nextLocale) => {
        const isActive = locale === nextLocale;
        const fullLabel = nextLocale === "ar" ? labels.ar : labels.en;
        return (
          <Link
            key={nextLocale}
            aria-label={fullLabel}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium outline-none hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",
              "focus-visible:ring-offset-card",
              isActive ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
            href={swapLocaleInPath(pathname, nextLocale)}
          >
            {nextLocale.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
