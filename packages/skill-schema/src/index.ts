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

// Lifecycle is orthogonal to `status`: status rates review quality,
// lifecycle rates discoverability. A skill can be `maintainer-reviewed`
// (high quality) and `deprecated` (superseded by a replacement) at the
// same time. See CONTRIBUTING.md for the decision matrix.
export const skillLifecycleSchema = z.enum([
  "active",
  "deprecated",
  "archived",
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

// POSIX-normalized relative path (no drive letters, no `..` segments, no leading `/`).
const SAFE_RELATIVE_PATH = /^(?!\/)(?!.*(^|\/)\.\.($|\/))[^\s][^\0]*$/;

export const skillFileSchema = z.object({
  path: z
    .string()
    .min(1)
    .regex(
      SAFE_RELATIVE_PATH,
      "support-file path must be a POSIX relative path without '..' segments",
    )
    .refine((value) => !value.includes("\\"), {
      message: "support-file path must use POSIX '/' separators",
    }),
  encoding: z.enum(["utf-8", "base64"]),
  content: z.string(),
});

// Legacy convenience shape (text references/scripts). Derived from skillFileSchema; kept so
// existing UI and callers that already iterate `references`/`scripts` keep working. New code
// should prefer `files` (the generic support-file list) on a GeneratedSkill.
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
  // Lifecycle defaults to "active" so existing skills migrate in place
  // without requiring a rewrite of every skill.yaml.
  lifecycle: skillLifecycleSchema.default("active"),
  replacement_id: z.string().min(1).optional(),
  sunset_date: isoDateSchema.optional(),
  lifecycle_note: localizedLabelSchema.optional(),
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
    if (value.replacement_id && value.replacement_id === value.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `replacement_id must reference a different skill id than "${value.id}".`,
        path: ["replacement_id"],
      });
    }
  },
);

export const generatedSkillSchema = canonicalSkillObjectSchema
  .omit({
    last_verified: true,
    previous_id: true,
    replacement_id: true,
    sunset_date: true,
    lifecycle_note: true,
  })
  .extend({
    lastVerified: isoDateSchema,
    previousIds: z.array(z.string().min(1)).default([]),
    replacementId: z.string().min(1).nullable().default(null),
    sunsetDate: isoDateSchema.nullable().default(null),
    lifecycleNote: localizedLabelSchema.nullable().default(null),
    body: z.string(),
    directory: z.string().min(1),
    files: z.array(skillFileSchema).default([]),
    // Derived convenience views (legacy). Readers should prefer `files`.
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
    if (value.replacementId && value.replacementId === value.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `replacementId must reference a different skill id than "${value.id}".`,
        path: ["replacementId"],
      });
    }
    const seen = new Set<string>();
    for (const file of value.files) {
      if (seen.has(file.path)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate support-file path: ${file.path}`,
          path: ["files"],
        });
      }
      seen.add(file.path);
    }
  });

export type LocalizedLabel = z.infer<typeof localizedLabelSchema>;
export type SkillMaintainer = z.infer<typeof skillMaintainerSchema>;
export type SkillSource = z.infer<typeof skillSourceSchema>;
export type SkillFile = z.infer<typeof skillFileSchema>;
export type SkillReference = z.infer<typeof skillReferenceSchema>;
export type SkillScript = z.infer<typeof skillScriptSchema>;
export type CanonicalSkill = z.infer<typeof canonicalSkillSchema>;
export type CanonicalSkillCategory = z.infer<typeof skillCategorySchema>;
export type CanonicalSkillStatus = z.infer<typeof skillStatusSchema>;
export type CanonicalSkillLifecycle = z.infer<typeof skillLifecycleSchema>;
export type CanonicalSkillTarget = z.infer<typeof skillTargetSchema>;
export type CanonicalSkillTrigger = z.infer<typeof skillTriggerSchema>;
export type CanonicalSkillVariable = z.infer<typeof skillVariableSchema>;
export type GeneratedSkill = z.infer<typeof generatedSkillSchema>;

// Cross-skill invariants that cannot be enforced in a single-skill schema
// (e.g. replacement_id must point at an existing skill). Surfaced as a
// separate helper so governance + loader both call it after parsing.
export type LifecycleCrossReferenceIssue = {
  skillId: string;
  sourceLabel?: string;
  code: "replacement-missing" | "replacement-self";
  message: string;
};

export type LifecycleCrossReferenceInput = {
  id: string;
  replacement_id?: string | null;
  sourceLabel?: string;
};

export function collectLifecycleCrossReferences(
  skills: readonly LifecycleCrossReferenceInput[],
): LifecycleCrossReferenceIssue[] {
  const ids = new Set(skills.map((skill) => skill.id));
  const issues: LifecycleCrossReferenceIssue[] = [];
  for (const skill of skills) {
    if (!skill.replacement_id) continue;
    if (skill.replacement_id === skill.id) {
      issues.push({
        skillId: skill.id,
        sourceLabel: skill.sourceLabel,
        code: "replacement-self",
        message: `Skill "${skill.id}" has replacement_id equal to its own id. A skill cannot replace itself.`,
      });
      continue;
    }
    if (!ids.has(skill.replacement_id)) {
      issues.push({
        skillId: skill.id,
        sourceLabel: skill.sourceLabel,
        code: "replacement-missing",
        message: `Skill "${skill.id}" declares replacement_id "${skill.replacement_id}" which does not exist in the skill catalog.`,
      });
    }
  }
  return issues;
}

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
