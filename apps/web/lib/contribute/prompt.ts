import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";

export type ContributeLocale = "en" | "ar";

export type ContributeAction = "add" | "update" | "retire" | "delete";

export type ContributeLifecycle = "active" | "deprecated" | "archived";

export type EstimatedBump = "patch" | "minor" | "major";

export type ContributorMaintainer = {
  github: string;
};

export type ContributorSource = {
  title: string;
  url: string;
  accessed: string;
};

export type ContributorVariable = {
  name: string;
  labelEn: string;
  labelAr: string;
  type: "select" | "boolean" | "text";
  options: string[];
};

// Trigger values round-trip with full type fidelity so an untouched update
// does not accidentally downgrade a boolean/number trigger to a string in
// the handoff prompt (which would create a false governance diff).
export type ContributorTriggerScalar = string | number | boolean | null;

export type ContributorTrigger = {
  key: string;
  value: ContributorTriggerScalar;
};

export type ContributorSupportFile = {
  path: string;
  description: string;
};

export type ContributorDraft = {
  action: ContributeAction;
  targetAgent: PromptAgent;
  locale: ContributeLocale;
  // ----- Add / Update shared metadata -----
  group: string;
  slug: string;
  id: string;
  previousId?: string | null;
  nameEn: string;
  nameAr: string;
  summaryEn: string;
  summaryAr: string;
  category: "compliance" | "security" | "architecture" | "";
  region: string | null;
  targets: TargetAgent[];
  status: "maintainer-reviewed" | "community-maintained" | "draft";
  version: string;
  lastVerified: string;
  disclaimer: boolean;
  maintainers: ContributorMaintainer[];
  sources: ContributorSource[];
  variables: ContributorVariable[];
  triggers: ContributorTrigger[];
  supportFiles: ContributorSupportFile[];
  intent: string;
  // ----- Update / Retire specific -----
  editSummary: string;
  // ----- Retire / lifecycle -----
  lifecycle: ContributeLifecycle;
  replacementId: string | null;
  sunsetDate: string | null;
  lifecycleNoteEn: string;
  lifecycleNoteAr: string;
  // ----- Delete -----
  deleteConfirmation: boolean;
  deleteRationale: string;
};

// Authoring flow may target any coding agent — the existing TargetAgent set
// already covers Claude Code, Cursor, Codex, and the generic AGENTS.md path.
export type PromptAgent = TargetAgent;

export type AuthoringPromptBundle = {
  agent: PromptAgent;
  action: ContributeAction;
  text: string;
  estimatedBump: EstimatedBump;
  charCount: number;
  byteSize: number;
};

export const DEFAULT_CONTRIBUTOR_DRAFT: ContributorDraft = {
  action: "add",
  targetAgent: "claude-code",
  locale: "en",
  group: "architecture",
  slug: "",
  id: "",
  previousId: null,
  nameEn: "",
  nameAr: "",
  summaryEn: "",
  summaryAr: "",
  category: "",
  region: null,
  targets: ["claude-code", "cursor", "codex", "agents-md"],
  status: "draft",
  version: "0.1.0",
  lastVerified: new Date().toISOString().slice(0, 10),
  disclaimer: false,
  maintainers: [{ github: "" }],
  sources: [{ title: "", url: "", accessed: new Date().toISOString().slice(0, 10) }],
  variables: [],
  triggers: [],
  supportFiles: [],
  intent: "",
  editSummary: "",
  lifecycle: "active",
  replacementId: null,
  sunsetDate: null,
  lifecycleNoteEn: "",
  lifecycleNoteAr: "",
  deleteConfirmation: false,
  deleteRationale: "",
};

export function hydrateDraftFromSkill(
  skill: GeneratedSkill,
  action: ContributeAction,
): ContributorDraft {
  const inferredGroup = skill.directory.split("/")[0] ?? "architecture";
  return {
    ...DEFAULT_CONTRIBUTOR_DRAFT,
    action,
    group: inferredGroup,
    slug: skill.slug,
    id: skill.id,
    previousId: null,
    nameEn: skill.name.en,
    nameAr: skill.name.ar,
    summaryEn: skill.summary?.en ?? "",
    summaryAr: skill.summary?.ar ?? "",
    category: skill.category,
    region: skill.region,
    targets: [...skill.targets],
    status: skill.status,
    version: skill.version,
    lastVerified: skill.lastVerified,
    disclaimer: skill.disclaimer,
    maintainers: skill.maintainers.map((maintainer) => ({ github: maintainer.github })),
    sources: skill.sources.map((source) => ({
      title: source.title,
      url: source.url,
      accessed: source.accessed,
    })),
    variables: skill.variables.map((variable) => ({
      name: variable.name,
      labelEn: variable.label.en,
      labelAr: variable.label.ar,
      type: variable.type,
      options: variable.options ?? [],
    })),
    triggers: skill.triggers.flatMap((trigger) =>
      Object.entries(trigger.when).map(([key, value]) => ({
        key,
        // Preserve the canonical scalar type so hydrating then re-emitting an
        // unchanged trigger produces an identical YAML token (`when: { x: true }`
        // stays `true`, never the string "true").
        value: (value ?? null) as ContributorTriggerScalar,
      })),
    ),
    supportFiles: skill.files.map((file) => ({
      path: file.path,
      description: "",
    })),
    intent: skill.summary?.en ?? "",
    editSummary: "",
    lifecycle: skill.lifecycle,
    replacementId: skill.replacementId,
    sunsetDate: skill.sunsetDate,
    lifecycleNoteEn: skill.lifecycleNote?.en ?? "",
    lifecycleNoteAr: skill.lifecycleNote?.ar ?? "",
    deleteConfirmation: false,
    deleteRationale: "",
  };
}

// Governance-estimator. Returns the strictest bump the agent will need to
// apply once the change is executed. Kept separate from the canonical
// `classifySkillDiff` so the UI can show a best-effort estimate without
// running a real diff against HEAD.
export function estimateBump(draft: ContributorDraft, baseline: GeneratedSkill | null): EstimatedBump {
  if (draft.action === "add") return "minor";
  if (draft.action === "delete") return "major";
  if (draft.action === "retire") {
    // Deprecating or archiving a skill is observable behavior change for
    // discovery — governance classifies this as minor. Archived + removed
    // replacement is still minor because the skill still exists.
    return "minor";
  }
  if (!baseline) return "patch";
  // Update mode — look at what the draft actually changed.
  let severity: EstimatedBump = "patch";
  const bumpOrder: Record<EstimatedBump, number> = { patch: 0, minor: 1, major: 2 };
  const raise = (level: EstimatedBump) => {
    if (bumpOrder[level] > bumpOrder[severity]) severity = level;
  };
  if (draft.id !== baseline.id) raise("major");
  if (draft.slug !== baseline.slug) raise("major");
  if (draft.category && draft.category !== baseline.category) raise("major");
  const baselineTargets = new Set(baseline.targets);
  const draftTargets = new Set(draft.targets);
  for (const t of baselineTargets) if (!draftTargets.has(t)) raise("major");
  for (const t of draftTargets) if (!baselineTargets.has(t)) raise("minor");
  const baselineVariableNames = new Set(baseline.variables.map((v) => v.name));
  const draftVariableNames = new Set(draft.variables.map((v) => v.name));
  for (const name of baselineVariableNames) if (!draftVariableNames.has(name)) raise("major");
  for (const name of draftVariableNames) if (!baselineVariableNames.has(name)) raise("minor");
  if (draft.region !== baseline.region) raise("minor");
  if (draft.supportFiles.length !== baseline.files.length) raise("minor");
  if (draft.triggers.length !== baseline.triggers.length) raise("minor");
  // Lifecycle transitions are minor even from the update tab.
  if (draft.lifecycle !== baseline.lifecycle) raise("minor");
  if ((draft.replacementId ?? null) !== (baseline.replacementId ?? null)) raise("minor");
  return severity;
}

function incrementVersion(version: string, bump: EstimatedBump): string {
  const [mainPart] = version.split(/[-+]/);
  const [majorStr, minorStr, patchStr] = mainPart.split(".");
  const major = Number.parseInt(majorStr ?? "0", 10) || 0;
  const minor = Number.parseInt(minorStr ?? "0", 10) || 0;
  const patch = Number.parseInt(patchStr ?? "0", 10) || 0;
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

export function suggestNextVersion(
  draft: ContributorDraft,
  baseline: GeneratedSkill | null,
): string {
  if (draft.action === "add") return draft.version || "0.1.0";
  if (!baseline) return draft.version || "0.1.0";
  return incrementVersion(baseline.version, estimateBump(draft, baseline));
}

type PromptCopy = {
  title: string;
  mission: string;
  sections: {
    files: string;
    content: string;
    governance: string;
    validation: string;
    boundaries: string;
    closing: string;
  };
};

const COPY: Record<ContributeLocale, Record<ContributeAction, PromptCopy>> = {
  en: {
    add: {
      title: "Author a new Wathba skill",
      mission:
        "Create a brand new skill under `skills/<group>/<slug>/` from the structured brief below. Do not modify unrelated skills.",
      sections: {
        files: "Files to author",
        content: "Canonical metadata (skill.yaml)",
        governance: "Governance expectations",
        validation: "Validation & handoff",
        boundaries: "Boundaries",
        closing: "When done",
      },
    },
    update: {
      title: "Update an existing Wathba skill",
      mission:
        "Apply the requested edits to the existing skill while preserving its identity. Do not rename, move, or retire the skill unless the brief explicitly asks.",
      sections: {
        files: "Files to touch",
        content: "Intended edits",
        governance: "Version bump",
        validation: "Validation & handoff",
        boundaries: "Boundaries",
        closing: "When done",
      },
    },
    retire: {
      title: "Retire a Wathba skill",
      mission:
        "Mark the named skill as deprecated or archived in its canonical skill.yaml, add the deprecation note, wire up the replacement pointer, and respect the lifecycle governance rules below.",
      sections: {
        files: "Files to touch",
        content: "Lifecycle metadata",
        governance: "Version bump",
        validation: "Validation & handoff",
        boundaries: "Boundaries",
        closing: "When done",
      },
    },
    delete: {
      title: "Hard-delete a Wathba skill (advanced maintenance)",
      mission:
        "Remove the skill package entirely. This is a MAJOR governance event — only proceed if the brief shows an explicit confirmation. If there is any chance the skill is still in use, prefer `retire` over `delete` and stop.",
      sections: {
        files: "Files and directories to remove",
        content: "Pre-deletion checks",
        governance: "Version bump",
        validation: "Validation & handoff",
        boundaries: "Boundaries",
        closing: "When done",
      },
    },
  },
  ar: {
    add: {
      title: "إنشاء مهارة Wathba جديدة",
      mission:
        "أنشئ مهارة جديدة تحت `skills/<group>/<slug>/` بناءً على الموجز المنظم أدناه. لا تعدّل أي مهارات أخرى.",
      sections: {
        files: "الملفات المطلوب إنشاؤها",
        content: "البيانات المرجعية (skill.yaml)",
        governance: "قواعد الحوكمة",
        validation: "التحقق والتسليم",
        boundaries: "الحدود",
        closing: "عند الانتهاء",
      },
    },
    update: {
      title: "تحديث مهارة Wathba قائمة",
      mission:
        "طبّق التعديلات المطلوبة على المهارة مع الحفاظ على هويتها. لا تعد تسميتها أو نقلها أو تعطيلها ما لم يطلب الموجز ذلك صراحةً.",
      sections: {
        files: "الملفات التي يجب تعديلها",
        content: "التعديلات المستهدفة",
        governance: "رقم الإصدار",
        validation: "التحقق والتسليم",
        boundaries: "الحدود",
        closing: "عند الانتهاء",
      },
    },
    retire: {
      title: "تقاعد مهارة Wathba",
      mission:
        "علّم المهارة المذكورة على أنها مهجورة أو مؤرشفة داخل skill.yaml الرسمي، وأضف ملاحظة الإيقاف، وربط المهارة البديلة، والتزم بقواعد دورة الحياة أدناه.",
      sections: {
        files: "الملفات التي يجب تعديلها",
        content: "بيانات دورة الحياة",
        governance: "رقم الإصدار",
        validation: "التحقق والتسليم",
        boundaries: "الحدود",
        closing: "عند الانتهاء",
      },
    },
    delete: {
      title: "حذف نهائي لمهارة Wathba (صيانة متقدمة)",
      mission:
        "احذف حزمة المهارة بالكامل. هذا حدث Major في الحوكمة — لا تتابع إلا إذا كان الموجز يتضمن تأكيدًا صريحًا. إذا كان هناك احتمال أن المهارة لا تزال مستخدمة، فضّل `retire` على `delete` وتوقّف.",
      sections: {
        files: "الملفات والمجلدات التي يجب حذفها",
        content: "فحوص قبل الحذف",
        governance: "رقم الإصدار",
        validation: "التحقق والتسليم",
        boundaries: "الحدود",
        closing: "عند الانتهاء",
      },
    },
  },
};

const AGENT_TITLE: Record<PromptAgent, Record<ContributeLocale, string>> = {
  "claude-code": {
    en: "Claude Code briefing",
    ar: "تعليمات Claude Code",
  },
  cursor: {
    en: "Cursor briefing",
    ar: "تعليمات Cursor",
  },
  codex: {
    en: "OpenAI Codex briefing",
    ar: "تعليمات Codex من OpenAI",
  },
  "agents-md": {
    en: "Generic agent briefing",
    ar: "تعليمات عامة للوكيل",
  },
};

const AGENT_HINT: Record<PromptAgent, Record<ContributeLocale, string>> = {
  "claude-code": {
    en: "Run this in Claude Code with the repo open as the working directory. Claude Code can execute `pnpm` commands directly.",
    ar: "شغّل هذا في Claude Code بينما يكون المستودع مفتوحًا كمجلد العمل. يستطيع Claude Code تنفيذ أوامر pnpm مباشرة.",
  },
  cursor: {
    en: "Paste this into Cursor's composer with the repo loaded. Cursor should run the referenced pnpm scripts in the integrated terminal.",
    ar: "الصق هذا في محرر Cursor بعد فتح المستودع. يجب على Cursor تشغيل أوامر pnpm المذكورة من داخل الطرفية المتكاملة.",
  },
  codex: {
    en: "Pass this briefing to Codex / GPT-5.4 with repository access. Codex should execute `pnpm generate:skills` and `pnpm verify:skills` before returning.",
    ar: "أعطِ هذه التعليمات إلى Codex / GPT-5.4 مع صلاحية المستودع. يجب أن ينفذ Codex أوامر pnpm generate:skills وpnpm verify:skills قبل الإرجاع.",
  },
  "agents-md": {
    en: "Any repo-aware coding agent can follow this briefing. It uses standard pnpm workspace commands.",
    ar: "يستطيع أي وكيل برمجي متصل بالمستودع تنفيذ هذه التعليمات؛ فهي تعتمد على أوامر pnpm القياسية لمساحة العمل.",
  },
};

function header(line: string): string {
  return `## ${line}`;
}

function bullet(lines: string[]): string[] {
  return lines.map((line) => `- ${line}`);
}

function numbered(lines: string[]): string[] {
  return lines.map((line, index) => `${index + 1}. ${line}`);
}

function formatYamlFence(content: string): string {
  return ["```yaml", content, "```"].join("\n");
}

// Characters that force YAML plain-style scalars into quoted form. If any of
// these appear, the value must be double-quoted with proper escapes so the
// downstream `yaml.load` parser (or any agent reading the fenced block) does
// not choke on inputs like `Payments: core` or localized text containing `#`.
const YAML_SPECIAL = /[:#&*!|>'"%@`\n\r\t]/;
const YAML_RESERVED_PLAIN = new Set([
  "",
  "null",
  "Null",
  "NULL",
  "~",
  "true",
  "True",
  "TRUE",
  "false",
  "False",
  "FALSE",
  "yes",
  "Yes",
  "YES",
  "no",
  "No",
  "NO",
  "on",
  "On",
  "ON",
  "off",
  "Off",
  "OFF",
]);

function yamlQuote(raw: string): string {
  const escaped = raw
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
}

// Trigger values may arrive as a raw typed scalar (preserved from hydration)
// or as a user-edited string. When the user edits, we best-effort re-infer
// booleans / numbers / null so the emitted YAML matches the schema's
// `Record<string, string | number | boolean | null>` shape. A quoted "true"
// stays a quoted string — contributors who want a literal boolean drop the
// quotes in the input box.
function yamlTriggerValue(value: ContributorTriggerScalar): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : yamlQuote(String(value));
  }
  const raw = String(value);
  const trimmed = raw.trim();
  if (trimmed === "true" || trimmed === "false") return trimmed;
  if (trimmed === "null" || trimmed === "~") return "null";
  if (/^-?\d+$/.test(trimmed)) return trimmed;
  if (/^-?\d+\.\d+$/.test(trimmed)) return trimmed;
  return yamlScalar(raw);
}

function yamlScalar(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : yamlQuote(String(value));
  const raw = String(value);
  if (YAML_RESERVED_PLAIN.has(raw)) return yamlQuote(raw);
  // Numbers formatted as strings — force quote so YAML keeps them textual.
  if (/^-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(raw)) return yamlQuote(raw);
  if (YAML_SPECIAL.test(raw)) return yamlQuote(raw);
  if (/^[-?{}\[\],]/.test(raw)) return yamlQuote(raw);
  if (raw.trimStart() !== raw || raw.trimEnd() !== raw) return yamlQuote(raw);
  return raw;
}

function draftToSkillYaml(draft: ContributorDraft): string {
  const lines: string[] = [];
  lines.push(`id: ${yamlScalar(draft.id || "<skill-id>")}`);
  lines.push("name:");
  lines.push(`  en: ${yamlScalar(draft.nameEn || "<english-name>")}`);
  lines.push(`  ar: ${yamlScalar(draft.nameAr || "<arabic-name>")}`);
  if (draft.summaryEn || draft.summaryAr) {
    lines.push("summary:");
    lines.push(`  en: ${yamlScalar(draft.summaryEn || "<english-summary>")}`);
    lines.push(`  ar: ${yamlScalar(draft.summaryAr || "<arabic-summary>")}`);
  }
  lines.push(`slug: ${yamlScalar(draft.slug || "<slug>")}`);
  if (draft.previousId) {
    lines.push("previous_id:");
    lines.push(`  - ${yamlScalar(draft.previousId)}`);
  }
  lines.push(`version: ${yamlScalar(draft.version || "0.1.0")}`);
  lines.push(`category: ${yamlScalar(draft.category || "architecture")}`);
  lines.push(`region: ${draft.region === null || draft.region === "" ? "null" : yamlScalar(draft.region)}`);
  lines.push("targets:");
  for (const target of draft.targets) lines.push(`  - ${yamlScalar(target)}`);
  lines.push(`status: ${yamlScalar(draft.status)}`);
  lines.push(`last_verified: ${yamlScalar(draft.lastVerified)}`);
  lines.push("maintainers:");
  for (const maintainer of draft.maintainers) {
    lines.push(`  - github: ${yamlScalar(maintainer.github || "@handle")}`);
  }
  lines.push("sources:");
  for (const source of draft.sources) {
    lines.push(`  - title: ${yamlScalar(source.title || "<title>")}`);
    lines.push(`    url: ${yamlScalar(source.url || "https://example.test")}`);
    lines.push(`    accessed: ${yamlScalar(source.accessed)}`);
  }
  lines.push(`disclaimer: ${yamlScalar(draft.disclaimer)}`);
  if (draft.variables.length > 0) {
    lines.push("variables:");
    for (const variable of draft.variables) {
      lines.push(`  - name: ${yamlScalar(variable.name)}`);
      lines.push("    label:");
      lines.push(`      en: ${yamlScalar(variable.labelEn)}`);
      lines.push(`      ar: ${yamlScalar(variable.labelAr)}`);
      lines.push(`    type: ${yamlScalar(variable.type)}`);
      if (variable.type === "select" && variable.options.length > 0) {
        lines.push("    options:");
        for (const option of variable.options) {
          lines.push(`      - ${yamlScalar(option)}`);
        }
      }
    }
  } else {
    lines.push("variables: []");
  }
  if (draft.triggers.length > 0) {
    lines.push("triggers:");
    for (const trigger of draft.triggers) {
      lines.push("  - when:");
      lines.push(
        `      ${yamlScalar(trigger.key)}: ${yamlTriggerValue(trigger.value)}`,
      );
    }
  } else {
    lines.push("triggers: []");
  }
  if (draft.lifecycle !== "active") {
    lines.push(`lifecycle: ${yamlScalar(draft.lifecycle)}`);
  }
  if (draft.replacementId) {
    lines.push(`replacement_id: ${yamlScalar(draft.replacementId)}`);
  }
  if (draft.sunsetDate) {
    lines.push(`sunset_date: ${yamlScalar(draft.sunsetDate)}`);
  }
  if (draft.lifecycleNoteEn || draft.lifecycleNoteAr) {
    lines.push("lifecycle_note:");
    lines.push(`  en: ${yamlScalar(draft.lifecycleNoteEn)}`);
    lines.push(`  ar: ${yamlScalar(draft.lifecycleNoteAr)}`);
  }
  return lines.join("\n");
}

function buildAddPrompt(draft: ContributorDraft, copy: PromptCopy): string {
  const estimatedVersion = draft.version || "0.1.0";
  const yaml = draftToSkillYaml({ ...draft, version: estimatedVersion });
  const parts: string[] = [];
  parts.push(`# ${copy.title}`, "");
  parts.push(copy.mission, "");
  parts.push(header(copy.sections.files));
  parts.push(
    ...bullet([
      `Create folder \`skills/${draft.group || "<group>"}/${draft.slug || "<slug>"}/\``,
      `Inside it, write \`skill.yaml\` with the metadata below.`,
      `Write \`SKILL.md\` with the body described in the Intent section.`,
      ...draft.supportFiles.map(
        (file) => `Write support file \`${file.path}\`${file.description ? ` — ${file.description}` : ""}.`,
      ),
    ]),
  );
  parts.push("");
  parts.push(header(copy.sections.content), "", formatYamlFence(yaml), "");
  parts.push("### SKILL.md intent");
  parts.push("", draft.intent || "<Describe the skill body the reader should write.>", "");
  parts.push(header(copy.sections.governance));
  parts.push(
    ...bullet([
      `Version starts at \`${estimatedVersion}\` (minor bump — new additive skill).`,
      `Category \`${draft.category || "architecture"}\` must keep \`disclaimer: ${draft.disclaimer}\`.`,
      `If category is \`compliance\`, \`disclaimer\` MUST be \`true\`.`,
      `\`lifecycle\` stays at \`active\`; \`replacement_id\`, \`sunset_date\`, and \`lifecycle_note\` remain unset.`,
    ]),
  );
  parts.push("");
  return parts.join("\n");
}

function buildUpdatePrompt(
  draft: ContributorDraft,
  copy: PromptCopy,
  baseline: GeneratedSkill | null,
): string {
  const yaml = draftToSkillYaml(draft);
  const parts: string[] = [];
  parts.push(`# ${copy.title}`, "");
  parts.push(copy.mission, "");
  parts.push(header(copy.sections.files));

  // Anchor the edit path on the baseline catalog entry. This is the folder
  // the coding agent should open to begin the edit — never the draft's
  // (editable) group/slug, which may have been cleared or tampered with.
  // Renames are described as an explicit "move" step after the edit so the
  // agent never runs `rm -rf` on a wrong directory.
  const baselineGroup = baseline ? (baseline.directory.split("/")[0] ?? draft.group) : draft.group;
  const baselineSlug = baseline ? baseline.slug : draft.slug;
  const targetPath = `skills/${baselineGroup}/${baselineSlug}/`;
  const isRename = Boolean(
    baseline && (draft.slug !== baseline.slug || baselineGroup !== draft.group || draft.id !== baseline.id),
  );
  const renamedPath = isRename ? `skills/${draft.group}/${draft.slug}/` : null;

  const fileBullets: string[] = [
    `Target skill directory (current): \`${targetPath}\``,
    `Update \`skill.yaml\` to match the metadata below.`,
    `Apply the "Intended edits" section to \`SKILL.md\`.`,
  ];
  if (renamedPath) {
    fileBullets.push(
      `After the edits land, move the directory from \`${targetPath}\` to \`${renamedPath}\` (this is a rename — keep the folder content intact).`,
    );
    fileBullets.push(
      `Record the migration by adding \`previous_id: [${baseline?.id ?? draft.previousId ?? "<old-id>"}]\` to the new \`skill.yaml\`.`,
    );
  }
  parts.push(...bullet(fileBullets));
  parts.push("");
  parts.push(header(copy.sections.content));
  parts.push("", "### Intended edits", "", draft.editSummary || "<Describe what should change in the skill body.>", "", "### Updated skill.yaml", "", formatYamlFence(yaml), "");
  parts.push(header(copy.sections.governance));
  parts.push(
    ...bullet([
      `Bump \`version\` to the UI-computed value \`${draft.version}\` before committing.`,
      isRename
        ? `This update renames \`${baseline?.id ?? "<old-id>"}\` → \`${draft.id}\`; that is a major bump and requires \`previous_id\`.`
        : `Do not change \`id\` or \`slug\` unless the brief explicitly says so — that is a major bump and requires \`previous_id\`.`,
      `If you add or remove a variable, preserve the classifier rules (added = minor, removed = major).`,
    ]),
  );
  parts.push("");
  return parts.join("\n");
}

function buildRetirePrompt(draft: ContributorDraft, copy: PromptCopy): string {
  const parts: string[] = [];
  parts.push(`# ${copy.title}`, "");
  parts.push(copy.mission, "");
  parts.push(header(copy.sections.files));
  parts.push(
    ...bullet([
      `Target skill directory: \`skills/${draft.group}/${draft.slug}/\``,
      `Edit \`skill.yaml\` — set \`lifecycle: ${draft.lifecycle}\`${draft.replacementId ? `, \`replacement_id: ${draft.replacementId}\`` : ""}${draft.sunsetDate ? `, \`sunset_date: \"${draft.sunsetDate}\"\`` : ""}.`,
      `Add or update \`lifecycle_note\` (en/ar) so the catalog shows deprecation guidance.`,
      `Do not delete the skill folder — retiring keeps the skill discoverable in the library.`,
    ]),
  );
  parts.push("");
  parts.push(header(copy.sections.content));
  parts.push("");
  if (draft.lifecycleNoteEn || draft.lifecycleNoteAr) {
    parts.push("```yaml");
    parts.push("lifecycle_note:");
    parts.push(`  en: ${yamlScalar(draft.lifecycleNoteEn || "<english note>")}`);
    parts.push(`  ar: ${yamlScalar(draft.lifecycleNoteAr || "<arabic note>")}`);
    parts.push("```");
  } else {
    parts.push("Add a short `lifecycle_note.en` and `lifecycle_note.ar` explaining why this skill is being retired and what readers should do instead.");
  }
  parts.push("");
  parts.push(header(copy.sections.governance));
  parts.push(
    ...bullet([
      `Bump \`version\` to \`${draft.version}\` (minor bump — lifecycle state change is observable discovery behaviour).`,
      `If \`replacement_id\` points at another skill, verify it exists in \`skills/**/skill.yaml\`; the loader will fail if it does not.`,
      `Archived skills must NOT surface in default recommendation flows — the UI already enforces this, but do not add them back in.`,
    ]),
  );
  parts.push("");
  return parts.join("\n");
}

function buildDeletePrompt(draft: ContributorDraft, copy: PromptCopy): string {
  const parts: string[] = [];
  parts.push(`# ${copy.title}`, "");
  parts.push(copy.mission, "");
  parts.push(header(copy.sections.files));
  parts.push(
    ...bullet([
      `Target directory to remove: \`skills/${draft.group}/${draft.slug}/\` (the entire folder, recursively).`,
      `Also remove any fixtures, snapshot references, or documentation that hard-codes the skill id \`${draft.id}\`.`,
    ]),
  );
  parts.push("");
  parts.push(header(copy.sections.content));
  parts.push("### Pre-deletion checks", "");
  parts.push(
    ...bullet([
      `Confirm no other skill declares \`replacement_id: ${draft.id}\` (the loader will fail if so — retire the dangling skill first).`,
      `Confirm the brief explicitly authorised a hard delete rather than retire+archive. Rationale: ${draft.deleteRationale || "<required rationale was not provided; stop and ask the maintainer.>"}`,
    ]),
  );
  parts.push("");
  parts.push(header(copy.sections.governance));
  parts.push(
    ...bullet([
      `A hard delete is a major governance event. If an unrelated skill is added in the same change, split the work into separate PRs or declare \`previous_id\` on the new skill to bypass the split-or-declare warning.`,
      `Regenerate the catalog with \`pnpm generate:skills\` so \`apps/web/lib/skills/generated.ts\` no longer references \`${draft.id}\`.`,
    ]),
  );
  parts.push("");
  return parts.join("\n");
}

function buildValidationBlock(copy: PromptCopy, action: ContributeAction): string {
  const parts: string[] = [];
  parts.push(header(copy.sections.validation));
  parts.push(
    ...numbered([
      "Run `pnpm generate:skills` to rebuild `apps/web/lib/skills/generated.ts` from source.",
      "Run `pnpm verify:skills` — version-bump policy, compliance freshness, and generated-output drift.",
      "If any test assertions rely on the edited skill, update them under `apps/web/tests/unit/` alongside the skill change.",
      action === "delete"
        ? "Confirm the deletion by running `git status` — only files under `skills/<group>/<slug>/` (and the regenerated catalog) should change."
        : "Never hand-edit `apps/web/lib/skills/generated.ts`; it is auto-generated.",
    ]),
  );
  parts.push("");
  parts.push(header(copy.sections.boundaries));
  parts.push(
    ...bullet([
      "Do not rename, move, or delete unrelated skills.",
      "Do not modify `apps/web/lib/skills/generated.ts` by hand — regenerate it.",
      "Do not skip the pre-commit hooks with `--no-verify` or similar flags.",
      "Do not introduce dependencies; the skill generator is intentionally dependency-light.",
    ]),
  );
  parts.push("");
  parts.push(header(copy.sections.closing));
  parts.push(
    ...bullet([
      "Summarise the files you created, edited, or deleted and the final version number.",
      "Report the classifier output from `pnpm verify:skills:versions` verbatim.",
    ]),
  );
  parts.push("");
  return parts.join("\n");
}

export function buildAuthoringPrompt(
  draft: ContributorDraft,
  baseline: GeneratedSkill | null,
): AuthoringPromptBundle {
  const locale = draft.locale;
  const copy = COPY[locale][draft.action];
  const nextVersion = suggestNextVersion(draft, baseline);
  // Retire and delete must always target the baseline's directory, even if
  // the draft's identity fields were tampered with. Update lets the user
  // rename (id/slug/group can diverge; `previous_id` is auto-declared).
  const shouldLockIdentity = (draft.action === "retire" || draft.action === "delete") && baseline;
  const draftWithVersion: ContributorDraft = {
    ...draft,
    version: draft.action === "add" ? draft.version || "0.1.0" : nextVersion,
    ...(shouldLockIdentity
      ? {
          id: baseline.id,
          slug: baseline.slug,
          group: baseline.directory.split("/")[0] ?? draft.group,
        }
      : {}),
  };

  const agentTitle = AGENT_TITLE[draft.targetAgent][locale];
  const agentHint = AGENT_HINT[draft.targetAgent][locale];

  const head: string[] = [
    `> ${agentTitle}`,
    `> ${agentHint}`,
    "",
  ];

  const actionBody = (() => {
    switch (draftWithVersion.action) {
      case "add":
        return buildAddPrompt(draftWithVersion, copy);
      case "update":
        return buildUpdatePrompt(draftWithVersion, copy, baseline);
      case "retire":
        return buildRetirePrompt(draftWithVersion, copy);
      case "delete":
        return buildDeletePrompt(draftWithVersion, copy);
      default:
        return "";
    }
  })();

  const tail = buildValidationBlock(copy, draftWithVersion.action);
  const text = [...head, actionBody, tail].join("\n");
  const bytes = new TextEncoder().encode(text).byteLength;
  return {
    agent: draftWithVersion.targetAgent,
    action: draftWithVersion.action,
    text,
    estimatedBump: estimateBump(draftWithVersion, baseline),
    charCount: text.length,
    byteSize: bytes,
  };
}

export function formatPromptSize(byteSize: number): string {
  if (byteSize < 1024) return `${byteSize} B`;
  if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(1)} KB`;
  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
}

// Public preview helper used by the Governance step's live YAML panel.
// Wraps the internal `draftToSkillYaml` so callers outside this module
// don't have to reimplement scalar escaping.
export function previewSkillYaml(draft: ContributorDraft): string {
  return draftToSkillYaml(draft);
}

// --- UX helpers used by the contributor wizard --------------------------

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function slugifyName(raw: string): string {
  const normalized = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return normalized;
}

export function deriveSkillId(group: string, slug: string): string {
  const left = slugifyName(group);
  const right = slugifyName(slug);
  if (!left && !right) return "";
  if (!left) return right;
  if (!right) return left;
  if (right.startsWith(`${left}-`) || right === left) return right;
  return `${left}-${right}`;
}

export function validateSlug(value: string): string | null {
  if (!value) return "Required.";
  if (!SLUG_PATTERN.test(value))
    return "Use kebab-case: lowercase letters, digits, single hyphens.";
  return null;
}

export function validateIsoDate(value: string): string | null {
  if (!value) return "Required.";
  if (!ISO_DATE_PATTERN.test(value)) return "Use YYYY-MM-DD.";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "Not a real calendar date.";
  if (parsed.toISOString().slice(0, 10) !== value)
    return "Not a real calendar date.";
  return null;
}

export function validateUrl(value: string): string | null {
  if (!value) return "Required.";
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return "Use http(s):// URLs.";
  } catch {
    return "Not a valid URL.";
  }
  return null;
}

// Pre-filled SKILL.md outline — drops the blank-page problem for authors
// who know what they want the skill to enforce but not how to structure it.
// Keeps the canonical "When this skill activates" / "Baseline rules" /
// "References" rhythm already used by the seed catalog.
export const SKILL_MD_OUTLINE = `# <Skill title>

## When this skill activates

Describe the repo state, task type, or file patterns that should trigger the
agent to read this skill.

## Baseline rules

1. …
2. …
3. …

## If the repository has no <X> yet

Describe the minimum safe setup the agent should add, and the constraints it
must not violate.

## Red flags

- …
- …

## References

- Link to an authoritative source in the skill.yaml \`sources\` list.
`;

// Lightweight add-mode quick-starts that pre-fill the non-body metadata so
// the contributor does not start from a blank schema.
export type ContributorTemplate = {
  id: "saudi-compliance" | "compliance-generic" | "security" | "architecture";
  group: string;
  category: ContributorDraft["category"];
  region: string | null;
  disclaimer: boolean;
  status: ContributorDraft["status"];
};

export const CONTRIBUTOR_TEMPLATES: readonly ContributorTemplate[] = [
  {
    id: "saudi-compliance",
    group: "saudi",
    category: "compliance",
    region: "saudi-arabia",
    disclaimer: true,
    status: "draft",
  },
  {
    id: "compliance-generic",
    group: "compliance",
    category: "compliance",
    region: null,
    disclaimer: true,
    status: "draft",
  },
  {
    id: "security",
    group: "security",
    category: "security",
    region: null,
    disclaimer: false,
    status: "draft",
  },
  {
    id: "architecture",
    group: "architecture",
    category: "architecture",
    region: null,
    disclaimer: false,
    status: "draft",
  },
] as const;

export function applyTemplate(
  template: ContributorTemplate,
  base: ContributorDraft,
): ContributorDraft {
  return {
    ...base,
    group: template.group,
    category: template.category,
    region: template.region,
    disclaimer: template.disclaimer,
    status: template.status,
  };
}
