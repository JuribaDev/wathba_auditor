import type { Metadata } from "next";
import {
  Amiri,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Source_Serif_4,
} from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";

import "../globals.css";

import { DocumentStateProvider } from "@/components/document-state-provider";
import {
  buildDocumentStateInitScript,
  DEFAULT_PRIMARY,
  DEFAULT_THEME,
} from "@/lib/document-state";
import { getDirection, isLocale, locales } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";

const latinSans = IBM_Plex_Sans({
  variable: "--font-latin-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const latinSerif = Source_Serif_4({
  variable: "--font-latin-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const latinMono = IBM_Plex_Mono({
  variable: "--font-latin-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const arabicSans = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic-sans",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

const arabicDisplay = Amiri({
  variable: "--font-arabic-display",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const t = await getTranslator(locale, "Meta");
  return {
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
  };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const fontVariables = [
  latinSans.variable,
  latinSerif.variable,
  latinMono.variable,
  arabicSans.variable,
  arabicDisplay.variable,
].join(" ");

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const initScript = buildDocumentStateInitScript();

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      data-theme={DEFAULT_THEME}
      data-primary={DEFAULT_PRIMARY}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        {/* The init script is a static function of server constants (no user
            input), so the inline payload is safe. Emitted via next/script's
            dangerouslySetInnerHTML prop so React 19 does not warn the way it
            does for child <script> elements. */}
        <Script
          id="document-state-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: initScript }}
        />
        <DocumentStateProvider>{children}</DocumentStateProvider>
      </body>
    </html>
  );
}
