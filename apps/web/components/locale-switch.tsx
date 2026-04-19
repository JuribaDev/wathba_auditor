"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { locales, swapLocaleInPath, type AppLocale } from "@/lib/i18n";

export function LocaleSwitch({ locale }: { locale: AppLocale }) {
  const pathname = usePathname() ?? `/${locale}`;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card px-2 py-1">
      {locales.map((nextLocale) => (
        <Link
          key={nextLocale}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium hover:text-foreground",
            locale === nextLocale ? "bg-secondary text-foreground" : "text-muted-foreground",
          )}
          href={swapLocaleInPath(pathname, nextLocale)}
        >
          {nextLocale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
