import * as React from "react";

import { cn } from "@/lib/utils";

export type SkillStatus = "reviewed" | "community" | "draft";

type StatusBadgeProps = {
  status: SkillStatus;
  children?: React.ReactNode;
  className?: string;
};

const statusStyles: Record<SkillStatus, string> = {
  reviewed: "bg-success/15 text-success",
  community: "bg-info/15 text-info",
  draft: "bg-warning/15 text-warning",
};

const defaultLabel: Record<SkillStatus, string> = {
  reviewed: "Reviewed",
  community: "Community",
  draft: "Draft",
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-block size-1.5 rounded-full bg-current"
      />
      {children ?? defaultLabel[status]}
    </span>
  );
}
