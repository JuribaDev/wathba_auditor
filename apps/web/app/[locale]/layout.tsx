import type { Metadata } from "next";
import {
  Amiri,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Source_Serif_4,
} from "next/font/google";
import { notFound } from "next/navigation";

import "../globals.css";

import { getDirection, isLocale, locales } from "@/lib/i18n";

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

export const metadata: Metadata = {
  title: {
    default: "Wathba Skills",
    template: "%s | Wathba Skills",
  },
  description:
    "Open-source skill pack generator for Saudi compliance, security, and architecture guidance.",
};

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

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
