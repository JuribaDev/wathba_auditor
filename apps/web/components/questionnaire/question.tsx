import * as React from "react";

import { Disclosure } from "@/components/ui/disclosure";
import { cn } from "@/lib/utils";

type QuestionProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  why?: React.ReactNode;
  whyAskLabel?: string;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Question({
  title,
  description,
  why,
  whyAskLabel,
  error,
  children,
  className,
}: QuestionProps) {
  return (
    <div
      data-slot="question"
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium leading-6 text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
      {why && whyAskLabel ? (
        <Disclosure summary={whyAskLabel}>{why}</Disclosure>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
