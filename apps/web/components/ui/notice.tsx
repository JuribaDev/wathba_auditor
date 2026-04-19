import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type NoticeVariant = "warning" | "info";

type NoticeProps = {
  variant?: NoticeVariant;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

const variantStyles: Record<NoticeVariant, string> = {
  warning:
    "border-warning/30 bg-warning/10 border-s-2 border-s-warning text-foreground [&_[data-notice-icon]]:text-warning",
  info:
    "border-info/30 bg-info/10 border-s-2 border-s-info text-foreground [&_[data-notice-icon]]:text-info",
};

const defaultIcon: Record<NoticeVariant, React.ReactNode> = {
  warning: <AlertTriangle aria-hidden="true" className="size-4" />,
  info: <Info aria-hidden="true" className="size-4" />,
};

export function Notice({
  variant = "warning",
  icon,
  title,
  children,
  className,
}: NoticeProps) {
  return (
    <div
      data-slot="notice"
      data-variant={variant}
      role="note"
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3.5 text-sm leading-6",
        variantStyles[variant],
        className,
      )}
    >
      <span
        data-notice-icon=""
        className="mt-0.5 flex-shrink-0"
        aria-hidden="true"
      >
        {icon ?? defaultIcon[variant]}
      </span>
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="font-medium text-foreground">{title}</p>
        ) : null}
        <div className={cn(title ? "mt-1" : undefined, "text-foreground/90")}>
          {children}
        </div>
      </div>
    </div>
  );
}
