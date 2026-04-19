import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppLocale } from "@/lib/i18n";
import type { GeneratedSkill } from "@/lib/skills/generated";

type SkillCardProps = {
  locale: AppLocale;
  skill: GeneratedSkill;
  children: ReactNode;
};

export function SkillCard({ locale, skill, children }: SkillCardProps) {
  const summary =
    skill.body
      .split("\n")
      .find((line) => line.trim().length > 0 && !line.trim().startsWith("#")) ?? "";

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{skill.category}</Badge>
          <Badge variant="outline">{skill.status}</Badge>
        </div>
        <CardTitle className="text-xl">{skill.name[locale]}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm leading-7 text-muted-foreground">
        <p>{summary}</p>
        <div className="flex flex-wrap gap-2">
          {skill.targets.map((target) => (
            <Badge key={target} variant="outline">
              {target}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-primary">{children}</CardFooter>
    </Card>
  );
}

