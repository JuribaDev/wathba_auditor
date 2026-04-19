"use client";

import { useMemo, useState } from "react";

import { SkillMiniCard, type SkillMiniCardLabels } from "@/components/skill-mini-card";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n";
import type { GeneratedSkill } from "@/lib/skills/generated";
import {
  CATEGORY_FILTERS,
  STATUS_FILTERS,
  filterSkills,
  type CategoryFilter,
  type StatusFilter,
} from "@/lib/skills/filters";

type TabOption<T extends string> = {
  id: T;
  label: string;
};

type SkillLibraryLabels = {
  categoryLegend: string;
  statusLegend: string;
  empty: string;
  category: Record<CategoryFilter, string>;
  status: Record<StatusFilter, string>;
  cardMeta: SkillMiniCardLabels;
};

type SkillLibraryProps = {
  locale: AppLocale;
  skills: GeneratedSkill[];
  labels: SkillLibraryLabels;
};

export function SkillLibrary({ locale, skills, labels }: SkillLibraryProps) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const categoryOptions: Array<TabOption<CategoryFilter>> = CATEGORY_FILTERS.map((id) => ({
    id,
    label: labels.category[id],
  }));
  const statusOptions: Array<TabOption<StatusFilter>> = STATUS_FILTERS.map((id) => ({
    id,
    label: labels.status[id],
  }));

  const filtered = useMemo(() => filterSkills(skills, category, status), [skills, category, status]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        <FilterTabs
          legend={labels.categoryLegend}
          options={categoryOptions}
          value={category}
          onChange={setCategory}
        />
        <FilterTabs
          legend={labels.statusLegend}
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
      </div>

      {filtered.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-border bg-surface-variant px-8 py-16 text-center text-muted-foreground"
        >
          {labels.empty}
        </div>
      ) : (
        <section
          aria-live="polite"
          className="grid gap-4 md:grid-cols-2"
        >
          {filtered.map((skill) => (
            <SkillMiniCard
              key={skill.id}
              locale={locale}
              skill={skill}
              href={`/${locale}/skills/${skill.id}`}
              labels={labels.cardMeta}
            />
          ))}
        </section>
      )}
    </div>
  );
}

type FilterTabsProps<T extends string> = {
  legend: string;
  options: Array<TabOption<T>>;
  value: T;
  onChange: (value: T) => void;
};

function FilterTabs<T extends string>({ legend, options, value, onChange }: FilterTabsProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-medium uppercase tracking-[0.16em] text-soft-foreground ltr:tracking-[0.16em] rtl:tracking-normal rtl:normal-case">
        {legend}
      </legend>
      <div role="tablist" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(option.id)}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
