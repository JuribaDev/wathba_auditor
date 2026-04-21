import type { Metadata } from "next";

import { defaultLocale } from "@/lib/i18n";
import { RedirectToDefaultLocale } from "./redirect-client";

const DEFAULT_PATH = `/${defaultLocale}/`;

export const metadata: Metadata = {
  title: "Wathba Skills",
  robots: { index: false, follow: false },
  alternates: { canonical: DEFAULT_PATH },
};

export default function RootPage() {
  return (
    <>
      <RedirectToDefaultLocale target={DEFAULT_PATH} />
      <noscript>
        <p style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
          <a href={DEFAULT_PATH}>Continue to Wathba Skills ({defaultLocale})</a>
        </p>
      </noscript>
    </>
  );
}
