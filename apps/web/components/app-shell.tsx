import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n";

type AppShellProps = {
  locale: AppLocale;
  section: "home" | "generate" | "skills";
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  locale,
  section,
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  const navItems = [
    { id: "home", href: `/${locale}`, label: locale === "ar" ? "الواجهة" : "Overview" },
    {
      id: "generate",
      href: `/${locale}/generate`,
      label: locale === "ar" ? "التوليد" : "Generate",
    },
    {
      id: "skills",
      href: `/${locale}/skills`,
      label: locale === "ar" ? "المهارات" : "Skills",
    },
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/80">
        <div className="app-grid gap-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Link className="text-sm font-semibold tracking-tight" href={`/${locale}`}>
                  Agent Skills
                </Link>
                <Badge variant="outline">{locale === "ar" ? "تجريبي" : "alpha"}</Badge>
              </div>
              <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    className={cn(
                      "hover:text-foreground",
                      item.id === section && "text-foreground",
                    )}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <LocaleSwitch locale={locale} />
          </div>
          <Separator />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid max-w-3xl gap-3">
              <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
            {actions ? <div className="lg:self-start">{actions}</div> : null}
          </div>
        </div>
      </header>

      <main className="app-grid pt-8">{children}</main>

      <footer className="mt-10 border-t border-border/80">
        <div className="app-grid gap-3 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {locale === "ar"
              ? "إرشادات هندسية وقوالب عمل، وليست استشارة قانونية."
              : "Engineering guidance and templates, not legal advice."}
          </p>
          <a
            className="hover:text-foreground"
            href="https://github.com"
            rel="noreferrer"
            target="_blank"
          >
            {locale === "ar" ? "المستودع" : "Repository"}
          </a>
        </div>
      </footer>
    </div>
  );
}

function LocaleSwitch({ locale }: { locale: AppLocale }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card px-2 py-1">
      {(["en", "ar"] as const).map((nextLocale) => (
        <Link
          key={nextLocale}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium hover:text-foreground",
            locale === nextLocale ? "bg-secondary text-foreground" : "text-muted-foreground",
          )}
          href={`/${nextLocale}`}
        >
          {nextLocale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
