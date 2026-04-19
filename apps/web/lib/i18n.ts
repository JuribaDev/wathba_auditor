export const locales = ["en", "ar"] as const;

export type AppLocale = (typeof locales)[number];

export function isLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function getDirection(locale: AppLocale) {
  return locale === "ar" ? "rtl" : "ltr";
}

