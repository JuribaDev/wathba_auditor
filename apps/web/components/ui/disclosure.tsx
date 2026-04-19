import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type DisclosureProps = {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function Disclosure({
  summary,
  children,
  defaultOpen,
  className,
}: DisclosureProps) {
  return (
    <details
      data-slot="disclosure"
      open={defaultOpen}
      className={cn("group/disclosure", className)}
    >
      <summary
        className={cn(
          "inline-flex cursor-pointer list-none items-center gap-1.5 rounded-sm py-1 text-sm text-muted-foreground outline-none",
          "hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            "group-open/disclosure:rotate-90",
            "rtl:rotate-180 rtl:group-open/disclosure:rotate-90",
          )}
        />
        <span>{summary}</span>
      </summary>
      <div
        className={cn(
          "mt-2.5 rounded-lg border-s-2 border-s-primary-soft bg-surface-variant px-4 py-3.5",
          "text-sm leading-6 text-muted-foreground",
        )}
      >
        {children}
      </div>
    </details>
  );
}
