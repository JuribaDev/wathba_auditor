export const locales = ["en", "ar"] as const;

export const defaultLocale: AppLocale = "en";

export type AppLocale = (typeof locales)[number];

export function isLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function getDirection(locale: AppLocale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function swapLocaleInPath(pathname: string, nextLocale: AppLocale): string {
  if (!pathname || !pathname.startsWith("/")) {
    return `/${nextLocale}`;
  }
  const [, first, ...rest] = pathname.split("/");
  if (first && isLocale(first)) {
    const tail = rest.join("/");
    return tail ? `/${nextLocale}/${tail}` : `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}

