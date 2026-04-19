import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { isLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/messages";

const SAMPLE_SKILL_BODY = `---
name: zatca-phase2
description: ZATCA Phase 2 e-invoicing rules for Saudi Arabia
version: 0.4.2
status: reviewed
last_verified: 2026-03-18
---

# ZATCA Phase 2

> This is engineering guidance, not legal advice. Verify every
> rule against the official ZATCA documentation linked in /sources.

## When this applies

You are working on a product that issues invoices to Saudi customers
and is using **Node.js** as the backend stack.

## Non-negotiables

- Every B2B invoice must be cleared with ZATCA **before** being
  delivered to the buyer.
- Every B2C invoice must be reported within **24 hours** of issuance.
- Every invoice XML must include a cryptographic stamp derived from
  the taxpayer's CSID certificate.

## Your stack specifics

\`\`\`ts
// Use the UBL builder — don't hand-roll the XML.
import { buildInvoiceXML, stamp } from "@zatca/ubl";
\`\`\`

See references/invoice-b2c.xml for a full sample.
`;

type LandingProps = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: LandingProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslator(locale, "Landing");

  return (
    <AppShell locale={locale} section="home">
      <section
        aria-labelledby="landing-hero-heading"
        className="grid items-center gap-12 py-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-12"
      >
        <div className="flex flex-col gap-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary ltr:tracking-[0.18em] rtl:tracking-normal rtl:normal-case">
            {t("eyebrow")}
          </p>
          <h1
            id="landing-hero-heading"
            className="font-heading text-[clamp(2.25rem,5.2vw,4rem)] font-semibold leading-[1.04] tracking-tight text-foreground"
          >
            {t("headline")}
          </h1>
          <p className="max-w-[56ch] text-base leading-[1.65] text-muted-foreground sm:text-lg">
            {t("lede")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={`/${locale}/generate`}>
                {t("primaryAction")}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href={`/${locale}/skills`}>{t("secondaryAction")}</Link>
            </Button>
          </div>
          <p className="text-sm text-soft-foreground">{t("microcopy")}</p>
        </div>

        <figure
          aria-label={t("samplePreviewLabel")}
          className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-md)] sm:p-7"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(ellipse_at_top_right,var(--primary-soft)_0%,transparent_55%)]"
          />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText aria-hidden="true" className="size-3.5" />
                <span className="font-mono text-xs">{t("sampleFilename")}</span>
              </div>
              <StatusBadge status="reviewed">{t("sampleHeaderBadge")}</StatusBadge>
            </div>
            <pre
              dir="ltr"
              className="max-h-[340px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-sunken p-5 text-left font-mono text-[12.5px] leading-[1.7] text-foreground"
            >
              {SAMPLE_SKILL_BODY}
            </pre>
          </div>
        </figure>
      </section>

      <section
        aria-labelledby="landing-what-is-heading"
        className="py-8 lg:py-12"
      >
        <div className="mx-auto max-w-[820px] rounded-[20px] border border-border bg-surface px-8 py-10 shadow-[var(--shadow-sm)] sm:px-10 sm:py-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary rtl:tracking-normal rtl:normal-case">
            {t("whatIsEyebrow")}
          </p>
          <h2
            id="landing-what-is-heading"
            className="mb-4 font-heading text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.12] tracking-tight text-foreground"
          >
            {t("whatIsTitle")}
          </h2>
          <p className="max-w-[65ch] text-base leading-[1.65] text-muted-foreground sm:text-[17px]">
            {t("whatIsBody")}
          </p>
        </div>
      </section>

      <section
        aria-label={t("featuresAriaLabel")}
        className="grid gap-8 py-10 sm:gap-6 md:grid-cols-3 lg:py-14"
      >
        {(["1", "2", "3"] as const).map((n) => (
          <article key={n} className="flex flex-col gap-2">
            <div
              aria-hidden="true"
              className="font-heading text-5xl italic leading-none text-primary"
            >
              {t(`feature${n}Marker`)}
            </div>
            <h3 className="font-heading text-xl font-semibold leading-snug text-foreground">
              {t(`feature${n}Title`)}
            </h3>
            <p className="text-[15px] leading-[1.6] text-muted-foreground">
              {t(`feature${n}Body`)}
            </p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
