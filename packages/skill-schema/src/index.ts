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

const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(timestamp)) return false;
  const parsed = new Date(timestamp).toISOString().slice(0, 10);
  return parsed === value;
}

export const semverSchema = z
  .string()
  .regex(SEMVER_REGEX, "version must be semver (e.g. 1.2.3 or 0.1.0-alpha.1)");

export const isoDateSchema = z
  .string()
  .refine(isValidIsoDate, "must be an ISO 8601 calendar date (YYYY-MM-DD)");

export const skillSourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  accessed: isoDateSchema,
});

export const skillMaintainerSchema = z.object({
  github: z.string().min(1),
});

export const skillTriggerSchema = z.object({
  when: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

export const skillReferenceSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export const skillScriptSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

const canonicalSkillObjectSchema = z.object({
  id: z.string().min(1),
  name: localizedLabelSchema,
  summary: localizedLabelSchema.optional(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "slug must be kebab-case (lowercase letters and digits separated by single hyphens)",
    ),
  previous_id: z.array(z.string().min(1)).optional(),
  version: semverSchema,
  category: skillCategorySchema,
  region: z.string().nullable(),
  targets: z.array(skillTargetSchema).min(1),
  status: skillStatusSchema,
  last_verified: isoDateSchema,
  maintainers: z.array(skillMaintainerSchema).min(1),
  sources: z.array(skillSourceSchema).min(1),
  disclaimer: z.boolean(),
  variables: z.array(skillVariableSchema).default([]),
  triggers: z.array(skillTriggerSchema).default([]),
});

const COMPLIANCE_DISCLAIMER_MESSAGE =
  "Compliance skills must set disclaimer: true so the UI surfaces the engineering-guidance-only notice.";

export const canonicalSkillSchema = canonicalSkillObjectSchema.superRefine(
  (value, ctx) => {
    if (value.category === "compliance" && value.disclaimer !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: COMPLIANCE_DISCLAIMER_MESSAGE,
        path: ["disclaimer"],
      });
    }
  },
);

export const generatedSkillSchema = canonicalSkillObjectSchema
  .omit({ last_verified: true, previous_id: true })
  .extend({
    lastVerified: isoDateSchema,
    previousIds: z.array(z.string().min(1)).default([]),
    body: z.string(),
    directory: z.string().min(1),
    references: z.array(skillReferenceSchema),
    scripts: z.array(skillScriptSchema),
  })
  .superRefine((value, ctx) => {
    if (value.category === "compliance" && value.disclaimer !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: COMPLIANCE_DISCLAIMER_MESSAGE,
        path: ["disclaimer"],
      });
    }
  });

export type LocalizedLabel = z.infer<typeof localizedLabelSchema>;
export type SkillMaintainer = z.infer<typeof skillMaintainerSchema>;
export type SkillSource = z.infer<typeof skillSourceSchema>;
export type SkillReference = z.infer<typeof skillReferenceSchema>;
export type SkillScript = z.infer<typeof skillScriptSchema>;
export type CanonicalSkill = z.infer<typeof canonicalSkillSchema>;
export type CanonicalSkillCategory = z.infer<typeof skillCategorySchema>;
export type CanonicalSkillStatus = z.infer<typeof skillStatusSchema>;
export type CanonicalSkillTarget = z.infer<typeof skillTargetSchema>;
export type CanonicalSkillTrigger = z.infer<typeof skillTriggerSchema>;
export type CanonicalSkillVariable = z.infer<typeof skillVariableSchema>;
export type GeneratedSkill = z.infer<typeof generatedSkillSchema>;

export class SkillValidationError extends Error {
  readonly issues: z.core.$ZodIssue[];
  readonly source?: string;

  constructor(issues: z.core.$ZodIssue[], source?: string) {
    super(formatSkillValidationMessage(issues, source));
    this.name = "SkillValidationError";
    this.issues = issues;
    this.source = source;
  }
}

function formatSkillValidationMessage(
  issues: z.core.$ZodIssue[],
  source?: string,
): string {
  const header = source
    ? `Invalid skill metadata at ${source}:`
    : "Invalid skill metadata:";
  const lines = issues.map((issue) => {
    const where = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `  - ${where}: ${issue.message}`;
  });
  return [header, ...lines].join("\n");
}

export type ParseCanonicalSkillOptions = {
  source?: string;
};

export function parseCanonicalSkill(
  input: unknown,
  options: ParseCanonicalSkillOptions = {},
): CanonicalSkill {
  const result = canonicalSkillSchema.safeParse(input);
  if (!result.success) {
    throw new SkillValidationError(result.error.issues, options.source);
  }
  return result.data;
}
