import { describe, expect, it } from "vitest";

import {
  buildAgentPrompt,
  chooseFence,
  detectLanguage,
  formatByteSize,
} from "@/lib/generate/prompt";
import type { GeneratedSkill, SkillFile } from "@/lib/skills/generated";

function makeSkill(overrides: Partial<GeneratedSkill> = {}): GeneratedSkill {
  return {
    id: "secrets-baseline",
    slug: "secrets-baseline",
    previousIds: [],
    lifecycle: "active",
    replacementId: null,
    sunsetDate: null,
    lifecycleNote: null,
    version: "0.1.0",
    category: "security",
    region: null,
    targets: ["claude-code", "cursor", "codex", "agents-md"],
    status: "maintainer-reviewed",
    lastVerified: "2026-04-19",
    maintainers: [],
    sources: [],
    disclaimer: false,
    name: { en: "Secrets Baseline", ar: "الأساسيات السرية" },
    summary: {
      en: "Scan and rotate secrets before commit.",
      ar: "افحص وأدِر الأسرار قبل الالتزام.",
    },
    body: "# Secrets Baseline\n\nAvoid committing secrets.\n",
    variables: [],
    triggers: [],
    directory: "security/secrets-baseline",
    files: [],
    references: [],
    scripts: [],
    ...overrides,
  };
}

function textFile(filePath: string, content: string): SkillFile {
  return { path: filePath, encoding: "utf-8", content };
}

function binaryFile(filePath: string, content: string): SkillFile {
  return { path: filePath, encoding: "base64", content };
}

describe("chooseFence", () => {
  it("returns triple backticks when content has no fences", () => {
    expect(chooseFence("plain text")).toBe("```");
  });

  it("escapes triple-backtick content with quadruple", () => {
    expect(chooseFence("```js\nx\n```")).toBe("````");
  });

  it("escapes the longest run present", () => {
    expect(chooseFence("`````\nbig\n`````")).toBe("``````");
  });
});

describe("detectLanguage", () => {
  it.each([
    [".claude/skills/x/SKILL.md", "markdown"],
    ["skills/y/skill.yaml", "yaml"],
    ["skills/y/scripts/run.mjs", "javascript"],
    ["foo/bar.ts", "typescript"],
    ["foo/data.json", "json"],
    ["unknown/file.xyz", "text"],
    [".cursor/skills/x/SKILL.md", "markdown"],
    [".agents/skills/x/SKILL.md", "markdown"],
  ])("maps %s → %s", (path, expected) => {
    expect(detectLanguage(path)).toBe(expected);
  });
});

describe("formatByteSize", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatByteSize(512)).toBe("512 B");
    expect(formatByteSize(2048)).toBe("2.0 KB");
    expect(formatByteSize(1024 * 20)).toBe("20 KB");
    expect(formatByteSize(1024 * 1024 * 2)).toBe("2.0 MB");
  });
});

describe("buildAgentPrompt", () => {
  const skills = [makeSkill()];

  it("returns a bundle with file count matching the adapter output", () => {
    const bundle = buildAgentPrompt("claude-code", skills, [], "en");
    expect(bundle.target).toBe("claude-code");
    expect(bundle.fileCount).toBeGreaterThan(0);
    expect(bundle.byteSize).toBeGreaterThanOrEqual(bundle.text.length);
  });

  it("includes the Claude target path hint and registration note", () => {
    const bundle = buildAgentPrompt("claude-code", skills, [], "en");
    expect(bundle.text).toContain(".claude/skills/");
    expect(bundle.text.toLowerCase()).toContain("claude code auto-discovers");
  });

  it("describes Cursor skills under .cursor/skills/ (not .cursor/rules/)", () => {
    const en = buildAgentPrompt("cursor", skills, [], "en");
    expect(en.text).toContain(".cursor/skills/");
    expect(en.text).not.toContain(".cursor/rules/");
    const ar = buildAgentPrompt("cursor", skills, [], "ar");
    expect(ar.text).toContain("تثبيت");
    expect(ar.text).toContain(".cursor/skills/");
    expect(ar.text).not.toContain(".cursor/rules/");
  });

  it("describes Codex skills under .agents/skills/ (not AGENTS.md)", () => {
    const bundle = buildAgentPrompt("codex", skills, [], "en");
    expect(bundle.text).toContain(".agents/skills/");
    // The Codex install prompt must not claim Codex reads skills from AGENTS.md.
    expect(bundle.text).not.toMatch(/appends? skills? to AGENTS\.md/i);
    expect(bundle.text).not.toMatch(/Codex reads AGENTS\.md/i);
  });

  it("keeps the AGENTS.md merge rule for the generic target only", () => {
    const generic = buildAgentPrompt("agents-md", skills, [], "en");
    expect(generic.text).toMatch(/DO NOT overwrite/);
    const codex = buildAgentPrompt("codex", skills, [], "en");
    expect(codex.text).not.toMatch(/DO NOT overwrite/);
    const claude = buildAgentPrompt("claude-code", skills, [], "en");
    expect(claude.text).not.toMatch(/DO NOT overwrite/);
  });

  it("renders every text file under its own header with a fenced block", () => {
    const bundle = buildAgentPrompt("claude-code", skills, [], "en");
    const headerCount = (bundle.text.match(/^### File /gm) ?? []).length;
    expect(headerCount).toBe(bundle.fileCount);
    expect(bundle.text).toContain("```markdown");
  });

  it("bumps fence length when a file's content contains triple backticks", () => {
    const skill = makeSkill({
      body: "# x\n\n```bash\necho 1\n```\n",
    });
    const bundle = buildAgentPrompt("claude-code", [skill], [], "en");
    expect(bundle.text).toContain("````markdown");
  });

  it("replaces binary files with a placeholder and warns the user", () => {
    const withBinary = makeSkill({
      files: [
        textFile("references/guide.md", "# guide"),
        binaryFile("assets/logo.png", "iVBORw0K"),
      ],
    });
    const bundle = buildAgentPrompt("claude-code", [withBinary], [], "en");
    expect(bundle.binaryFileCount).toBe(1);
    expect(bundle.text).toContain("assets/logo.png");
    expect(bundle.text).toContain("[binary content");
    // The raw base64 payload must never leak into the text prompt.
    expect(bundle.text).not.toContain("iVBORw0K");
    expect(bundle.text.toLowerCase()).toContain("zip");
  });

  it("reports zero binary files for a text-only skill pack", () => {
    const textOnly = makeSkill({
      files: [textFile("references/guide.md", "# guide")],
    });
    const bundle = buildAgentPrompt("claude-code", [textOnly], [], "en");
    expect(bundle.binaryFileCount).toBe(0);
  });
});
