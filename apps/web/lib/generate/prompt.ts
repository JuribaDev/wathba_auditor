import type { RenderedFile } from "@/lib/generate/adapters/claude-code";
import type { SkillResolution } from "@/lib/generate/resolve-markdown";
import { buildTargetFiles } from "@/lib/generate/zip";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";

export type AgentPromptLocale = "en" | "ar";

export type AgentPromptCopy = {
  title: string;
  contextLine: string;
  instructionsHeading: string;
  instructions: readonly string[];
  registrationHeading: string;
  registration: string;
  filesHeading: string;
  fileHeader: string;
  confirmationLine: string;
};

export type AgentPromptBundle = {
  target: TargetAgent;
  text: string;
  fileCount: number;
  byteSize: number;
};

const PATH_LABEL: Record<TargetAgent, string> = {
  "claude-code": ".claude/skills/",
  cursor: ".cursor/rules/",
  codex: "AGENTS.md + references/",
  "agents-md": "AGENTS.md + references/",
};

const REGISTRATION: Record<TargetAgent, Record<AgentPromptLocale, string>> = {
  "claude-code": {
    en: "Claude Code auto-discovers skills in .claude/skills/. No further registration is required once the files exist.",
    ar: "سيكتشف Claude Code المهارات تلقائياً من مجلد .claude/skills/. لا يلزم أي إعداد إضافي بعد إنشاء الملفات.",
  },
  cursor: {
    en: "Cursor loads every .mdc file inside .cursor/rules/ at project load. Reload the window if Cursor is already open.",
    ar: "يحمّل Cursor جميع ملفات .mdc داخل .cursor/rules/ عند فتح المشروع. أعد تشغيل نافذة Cursor إذا كانت مفتوحة.",
  },
  codex: {
    en: "Codex reads AGENTS.md at session start. Append the provided skill references under the existing skills section, or create that section if absent.",
    ar: "يقرأ Codex ملف AGENTS.md عند بدء الجلسة. أضف المراجع المطلوبة تحت قسم المهارات، أو أنشئ القسم إن لم يكن موجوداً.",
  },
  "agents-md": {
    en: "Any agent that reads AGENTS.md will see the skill references after you write the files. No registration API is required.",
    ar: "أي وكيل يقرأ AGENTS.md سيرى المراجع بعد كتابة الملفات. لا حاجة لأي تسجيل إضافي.",
  },
};

const AGENT_NAME: Record<TargetAgent, Record<AgentPromptLocale, string>> = {
  "claude-code": { en: "Claude Code", ar: "Claude Code" },
  cursor: { en: "Cursor", ar: "Cursor" },
  codex: { en: "OpenAI Codex", ar: "OpenAI Codex" },
  "agents-md": { en: "a generic AGENTS.md agent", ar: "وكيل يقرأ AGENTS.md" },
};

function mergesIntoExistingAgentsMd(target: TargetAgent): boolean {
  return target === "codex" || target === "agents-md";
}

export function buildAgentPromptCopy(
  target: TargetAgent,
  locale: AgentPromptLocale,
  fileCount: number,
): AgentPromptCopy {
  const agentName = AGENT_NAME[target][locale];
  const mergesAgentsMd = mergesIntoExistingAgentsMd(target);
  const countWord = locale === "ar" ? "ملف" : fileCount === 1 ? "file" : "files";

  const collisionRuleEn = mergesAgentsMd
    ? [
        "If the generated file is AGENTS.md and the repo already has one, DO NOT overwrite the existing file. Perform a SECTION-LEVEL MERGE instead:",
        "  (a) Treat the AGENTS.md block below as a source of individual skill sections — each starts with a `## <Skill Name> · v<version>` heading.",
        "  (b) For every such section in the block, find a matching heading in the existing AGENTS.md (same leading text up to the ` · v` separator). If found, replace that heading and everything under it up to the next `## ` heading (or EOF). If not found, append the section to the end of the existing AGENTS.md.",
        "  (c) DO NOT copy the block's leading `# AGENTS.md` title, preamble, or any section that is not a `## <Skill Name>` section — those are formatting scaffolding for first-time installs only.",
        "  (d) Leave every non-Wathba section in the existing AGENTS.md untouched.",
        "For any non-AGENTS.md file, create new files and overwrite only if the path already came from a prior Wathba install.",
      ].join("\n")
    : "If a directory exists, add the file beside existing ones. If a file path collides, overwrite it.";

  const collisionRuleAr = mergesAgentsMd
    ? [
        "إن كان الملف المُنشأ هو AGENTS.md وكان موجوداً مسبقاً، فلا تستبدله. نفّذ دمجاً على مستوى الأقسام:",
        "  (أ) اعتبر كتلة AGENTS.md أدناه مصدراً لأقسام المهارات الفردية — كل قسم يبدأ بعنوان `## <اسم المهارة> · v<الإصدار>`.",
        "  (ب) لكل قسم في الكتلة، ابحث عن عنوان مطابق في AGENTS.md الحالي (نفس النص حتى الفاصل ` · v`). إن وُجد، استبدل ذلك العنوان وكل ما تحته حتى العنوان التالي `## ` (أو نهاية الملف). إن لم يُوجد، أضف القسم إلى نهاية AGENTS.md الحالي.",
        "  (ج) لا تنسخ العنوان الرئيسي `# AGENTS.md` في الكتلة ولا المقدمة ولا أي قسم غير `## <اسم المهارة>` — تلك بنية أولية تُستخدم فقط للتثبيت الأول.",
        "  (د) اترك كل قسم غير تابع لوَثبة في AGENTS.md كما هو.",
        "للمسارات الأخرى، أنشئ الملفات أو استبدلها فقط إن كانت من تثبيت وَثبة سابق.",
      ].join("\n")
    : "إن وُجد المجلد مسبقاً، أضف الملف دون حذف غيره. إن وُجد نفس المسار، أعد الكتابة.";

  if (locale === "ar") {
    return {
      title: `تثبيت مهارات وَثبة لـ ${agentName}`,
      contextLine: `أنت مساعد ترميز ذكي. سيقدّم لك المستخدم ${fileCount} ${countWord} محتوى مهارات مطلوب إنشاؤها داخل مستودعه.`,
      instructionsHeading: "## التعليمات",
      instructions: [
        "أنشئ كل ملف بالمسار المعروض أدناه تماماً، نسبةً إلى جذر المستودع.",
        mergesAgentsMd
          ? "احفظ محتوى كل ملف حرفياً عند إنشاء ملف جديد. بالنسبة للدمج في AGENTS.md الموجود، طبّق قواعد الدمج أدناه مع الحفاظ على المحتوى الأصلي للأقسام المنقولة حرفياً."
          : "احفظ محتوى كل ملف حرفياً — لا تلخّص ولا تعيد تنسيق YAML frontmatter.",
        collisionRuleAr,
        "بعد الانتهاء، أكّد للمستخدم عدد الملفات التي كُتبت وعرض المسارات.",
      ],
      registrationHeading: "## التسجيل",
      registration: REGISTRATION[target].ar,
      filesHeading: "## الملفات",
      fileHeader: "الملف",
      confirmationLine: "أكّد للمستخدم أن جميع الملفات أُنشئت بعد الانتهاء.",
    };
  }
  return {
    title: `Install Wathba skills for ${agentName}`,
    contextLine: `You are an AI coding assistant. The user is about to paste ${fileCount} ${countWord} of skill content to install into their repository.`,
    instructionsHeading: "## Instructions",
    instructions: [
      "Create each file at the exact path shown below, relative to the repo root.",
      mergesAgentsMd
        ? "Preserve the content of every section you transplant verbatim — do not reformat or summarize skill bodies. When a file is created fresh (no existing target), copy it verbatim. For AGENTS.md that already exists, follow the section-level merge below so you do not discard unrelated content."
        : "Preserve every file's content verbatim — do not reformat, summarize, or alter YAML frontmatter.",
      collisionRuleEn,
      "After writing, confirm the number of files created and echo the paths back to the user.",
    ],
    registrationHeading: "## Registration",
    registration: REGISTRATION[target].en,
    filesHeading: "## Files",
    fileHeader: "File",
    confirmationLine: "Confirm all files were created once finished.",
  };
}

export function chooseFence(content: string): string {
  const matches = content.match(/`{3,}/g);
  if (!matches) return "```";
  const longest = matches.reduce((max, run) => Math.max(max, run.length), 0);
  return "`".repeat(longest + 1);
}

export function detectLanguage(path: string): string {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "md":
    case "mdc":
    case "markdown":
      return "markdown";
    case "yaml":
    case "yml":
      return "yaml";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "sh":
    case "bash":
      return "bash";
    default:
      return "text";
  }
}

function renderFileBlock(
  file: RenderedFile,
  index: number,
  total: number,
  copy: AgentPromptCopy,
): string {
  const fence = chooseFence(file.content);
  const language = detectLanguage(file.path);
  const trimmed = file.content.endsWith("\n")
    ? file.content.slice(0, -1)
    : file.content;
  return [
    `### ${copy.fileHeader} ${index + 1} / ${total}: \`${file.path}\``,
    "",
    `${fence}${language}`,
    trimmed,
    fence,
  ].join("\n");
}

export function buildAgentPrompt(
  target: TargetAgent,
  skills: readonly GeneratedSkill[],
  resolutions: readonly SkillResolution[],
  locale: AgentPromptLocale = "en",
): AgentPromptBundle {
  const files = buildTargetFiles(target, skills, resolutions);
  const copy = buildAgentPromptCopy(target, locale, files.length);
  const pathHint = PATH_LABEL[target];

  const head: string[] = [
    `# ${copy.title}`,
    "",
    copy.contextLine,
    "",
    copy.instructionsHeading,
    "",
    ...copy.instructions.map((line, i) => `${i + 1}. ${line}`),
    "",
    copy.registrationHeading,
    "",
    `- ${locale === "ar" ? "المسار" : "Target path"}: \`${pathHint}\``,
    `- ${copy.registration}`,
    "",
    copy.filesHeading,
  ];

  const body = files.map((file, index) =>
    renderFileBlock(file, index, files.length, copy),
  );

  const text = [...head, "", ...body, "", copy.confirmationLine, ""].join("\n");

  const byteSize =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(text).length
      : text.length;

  return {
    target,
    text,
    fileCount: files.length,
    byteSize,
  };
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}
