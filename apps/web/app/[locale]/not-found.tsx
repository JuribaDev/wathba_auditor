"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

const catalogs = { en: enMessages, ar: arMessages };

type NotFoundLocale = keyof typeof catalogs;

function detectLocale(pathname: string | null): NotFoundLocale {
  if (pathname && pathname.startsWith("/ar")) {
    return "ar";
  }
  return "en";
}

export default function NotFoundPage() {
  const pathname = usePathname();
  const locale = detectLocale(pathname);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const t = catalogs[locale].NotFound;

  return (
    <main
      lang={locale}
      dir={dir}
      className="app-grid min-h-screen justify-center"
    >
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">{t.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>{t.description}</p>
          <Button asChild className="w-fit">
            <Link href={`/${locale}`}>{t.cta}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
