import { z } from "zod";

export const localizedLabelSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1),
});

export const skillCategorySchema = z.enum([
  "compliance",
  "security",
  "architecture",
]);

export const skillTargetSchema = z.enum([
  "claude-code",
  "cursor",
  "codex",
  "agents-md",
]);

export const skillStatusSchema = z.enum([
  "maintainer-reviewed",
  "community-maintained",
  "draft",
]);

export const skillVariableSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-z0-9_]*$/),
    label: localizedLabelSchema,
    type: z.enum(["select", "boolean", "text"]),
    options: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "select" && (!value.options || value.options.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select variables must declare at least one option.",
        path: ["options"],
      });
    }

    if (value.type !== "select" && value.options) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only select variables can declare options.",
        path: ["options"],
      });
    }
  });

export const skillSourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  accessed: z.string().min(1),
});

export const skillMaintainerSchema = z.object({
  github: z.string().min(1),
});

export const skillTriggerSchema = z.object({
  when: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

export const canonicalSkillSchema = z.object({
  id: z.string().min(1),
  name: localizedLabelSchema,
  slug: z.string().min(1),
  version: z.string().min(1),
  category: skillCategorySchema,
  region: z.string().nullable(),
  targets: z.array(skillTargetSchema).min(1),
  status: skillStatusSchema,
  last_verified: z.string().min(1),
  maintainers: z.array(skillMaintainerSchema).min(1),
  sources: z.array(skillSourceSchema).min(1),
  disclaimer: z.boolean(),
  variables: z.array(skillVariableSchema).default([]),
  triggers: z.array(skillTriggerSchema).default([]),
});

export type CanonicalSkill = z.infer<typeof canonicalSkillSchema>;
export type CanonicalSkillCategory = z.infer<typeof skillCategorySchema>;
export type CanonicalSkillStatus = z.infer<typeof skillStatusSchema>;
export type CanonicalSkillTarget = z.infer<typeof skillTargetSchema>;
export type CanonicalSkillTrigger = z.infer<typeof skillTriggerSchema>;
export type CanonicalSkillVariable = z.infer<typeof skillVariableSchema>;
