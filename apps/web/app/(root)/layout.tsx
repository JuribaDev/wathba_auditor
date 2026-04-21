import type { ReactNode } from "react";

import { defaultLocale } from "@/lib/i18n";

// Separate root layout for the `/` redirect route. The main `[locale]/layout.tsx`
// remains the root layout for every localized route. Next.js supports multiple
// root layouts via route groups — each group needs its own `<html>`/`<body>`.
export default function RedirectRootLayout({ children }: { children: ReactNode }) {
  const target = `/${defaultLocale}/`;
  return (
    <html lang={defaultLocale}>
      <head>
        {/*
         * Rendered directly so it is serialized as `http-equiv`, which
         * Next's Metadata `other` field cannot emit. Meta-refresh is the
         * no-JavaScript fallback; the client component handles the normal
         * path with `location.replace`.
         */}
        <meta httpEquiv="refresh" content={`0; url=${target}`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
