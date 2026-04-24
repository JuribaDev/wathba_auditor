import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AddSkillCtaProps = {
  locale: AppLocale;
  label: string;
  eyebrow: string;
  helper: string;
  className?: string;
};

// Page-header contributor CTA. The helper is intentionally rendered as
// visible supporting text, not just as a `title` tooltip, so contributors
// see up-front that this flow prepares an agent brief rather than
// publishing a skill directly from the browser. The dashed outline and
// circular plus echo the "Start from a template" treatment on the
// wizard so the library page and the contributor flow read as a single
// product surface.
export function AddSkillCta({
  locale,
  label,
  eyebrow,
  helper,
  className,
}: AddSkillCtaProps) {
  return (
    <Link
      href={`/${locale}/skills/contribute?action=add`}
      data-slot="skills-add-cta"
      aria-label={`${eyebrow}: ${label}. ${helper}`}
      className={cn(
        "group relative inline-flex max-w-md items-start gap-3 rounded-2xl border border-dashed border-border-strong bg-surface px-4 py-3.5 shadow-[var(--shadow-sm)]",
        "transition-all duration-150",
        "hover:border-primary hover:bg-primary/[0.04] hover:shadow-[var(--shadow-md)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong text-foreground",
          "transition-colors duration-150",
          "group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        <Plus className="size-4" />
      </span>
      <span className="grid min-w-0 gap-0.5 text-start">
        <span
          className={cn(
            "text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted-foreground",
            "rtl:tracking-normal rtl:normal-case",
            "transition-colors group-hover:text-primary",
          )}
        >
          {eyebrow}
        </span>
        <span className="font-heading text-[15px] leading-5 text-foreground">
          {label}
        </span>
        <span
          data-slot="skills-add-cta-helper"
          className="mt-1 text-[12.5px] leading-[1.45] text-muted-foreground"
        >
          {helper}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className={cn(
          "ms-1 mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150",
          "group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5",
        )}
      />
    </Link>
  );
}
