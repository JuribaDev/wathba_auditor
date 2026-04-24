import type { Metadata } from "next";

import { RedirectToDefaultLocale } from "@/app/(root)/redirect-client";
import { defaultLocale } from "@/lib/i18n";

const TARGET = `/${defaultLocale}/migrate/`;

export const metadata: Metadata = {
  title: "Redirecting to migrate",
  robots: { index: false, follow: false },
  alternates: { canonical: TARGET },
};

export default function MigrateRedirectPage() {
  return (
    <>
      <RedirectToDefaultLocale target={TARGET} preserveSearch />
      <noscript>
        <p style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
          <a href={TARGET}>Continue to migrate</a>
        </p>
      </noscript>
    </>
  );
}
