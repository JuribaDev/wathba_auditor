import type { ReactNode, SVGProps } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LocaleSwitch } from "@/components/locale-switch";
import { ThemeControls } from "@/components/theme-controls";
import { cn } from "@/lib/utils";
import { getTranslator } from "@/lib/messages";
import type { AppLocale } from "@/lib/i18n";

const REPO_URL = "https://github.com/wathba-skills/wathba-skills";

function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.97 3.22 9.18 7.69 10.67.56.1.77-.24.77-.54 0-.27-.01-1.15-.02-2.08-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.64 1.22 3.28.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.11 1.15.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.45 3.11-1.15 3.11-1.15.61 1.54.23 2.68.11 2.96.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55.4.34.76 1.02.76 2.06 0 1.49-.01 2.69-.01 3.05 0 .3.2.65.78.54 4.47-1.5 7.68-5.7 7.68-10.67C23.25 5.48 18.27.5 12 .5Z" />
    </svg>
  );
}

type AppShellProps = {
  locale: AppLocale;
  section: "home" | "generate" | "skills";
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export async function AppShell({
  locale,
  section,
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  const t = await getTranslator(locale, "Shell");

  const navItems = [
    { id: "home", href: `/${locale}`, label: t("navOverview") },
    { id: "skills", href: `/${locale}/skills`, label: t("navSkills") },
    { id: "generate", href: `/${locale}/generate`, label: t("navGenerate") },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        {t("skipToContent")}
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="app-grid gap-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              aria-label={t("brand")}
              className="flex items-center gap-2 text-sm font-semibold tracking-tight"
              href={`/${locale}`}
            >
              <span
                aria-hidden="true"
                className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground font-serif text-sm"
              >
                W
              </span>
              <span>{t("brand")}</span>
              <Badge variant="outline">{t("brandBadge")}</Badge>
            </Link>

            <nav
              aria-label={t("brand")}
              className="order-last flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground md:order-none md:w-auto md:ms-2"
            >
              {navItems.map((item) => (
                <Link
                  aria-current={item.id === section ? "page" : undefined}
                  className={cn(
                    "rounded-sm px-1 py-0.5 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                    item.id === section && "text-foreground",
                  )}
                  href={item.href}
                  key={item.id}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 md:ms-auto">
              <Button asChild size="icon-sm" variant="ghost" aria-label={t("github")}>
                <a href={REPO_URL} rel="noreferrer" target="_blank">
                  <GithubIcon />
                </a>
              </Button>
              <ThemeControls
                className="hidden sm:flex"
                labels={{
                  themeGroupLabel: t("themeGroupLabel"),
                  themeLight: t("themeLight"),
                  themeDark: t("themeDark"),
                  primaryGroupLabel: t("primaryGroupLabel"),
                  primaryDefault: t("primaryDefault"),
                  primaryInk: t("primaryInk"),
                  primaryOlive: t("primaryOlive"),
                  primarySlate: t("primarySlate"),
                }}
              />
              <LocaleSwitch
                locale={locale}
                labels={{
                  groupLabel: t("localeSwitchLabel"),
                  en: t("localeEnglish"),
                  ar: t("localeArabic"),
                }}
              />
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href={`/${locale}/generate`}>
                  {t("cta")}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
          {title || description || actions ? (
            <>
              <Separator />
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                {title || description ? (
                  <div className="grid max-w-3xl gap-3">
                    {title ? (
                      <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
                    ) : null}
                    {description ? (
                      <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                        {description}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {actions ? <div className="lg:self-start">{actions}</div> : null}
              </div>
            </>
          ) : null}
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="app-grid flex-1 pt-8 focus:outline-none"
      >
        {children}
      </main>

      <footer className="mt-10 border-t border-border/80">
        <div className="app-grid gap-3 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl leading-6">{t("footerDisclaimer")}</p>
          <nav
            aria-label={t("footerRepo")}
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            <a
              className="hover:text-foreground"
              href={`${REPO_URL}/blob/main/LICENSE`}
              rel="noreferrer"
              target="_blank"
            >
              {t("footerLicense")}
            </a>
            <a
              className="hover:text-foreground"
              href={`${REPO_URL}/blob/main/DISCLAIMER.md`}
              rel="noreferrer"
              target="_blank"
            >
              {t("footerDisclaimerLink")}
            </a>
            <a
              className="hover:text-foreground"
              href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
              rel="noreferrer"
              target="_blank"
            >
              {t("footerContributing")}
            </a>
            <a
              className="inline-flex items-center gap-1.5 hover:text-foreground"
              href={REPO_URL}
              rel="noreferrer"
              target="_blank"
            >
              <GithubIcon className="size-3.5" />
              {t("footerRepo")}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
