import { describe, expect, it } from "vitest";

import {
  buildAgentPrompt,
  chooseFence,
  detectLanguage,
  formatByteSize,
} from "@/lib/generate/prompt";
import type { GeneratedSkill } from "@/lib/skills/generated";

function makeSkill(overrides: Partial<GeneratedSkill> = {}): GeneratedSkill {
  return {
    id: "secrets-baseline",
    slug: "secrets-baseline",
    version: "0.1.0",
    status: "stable",
    lastVerified: "2026-04-19",
    categories: ["security"],
    targets: ["claude-code", "cursor", "codex", "agents-md"],
    disclaimer: false,
    name: { en: "Secrets Baseline", ar: "الأساسيات السرية" },
    summary: {
      en: "Scan and rotate secrets before commit.",
      ar: "افحص وأدِر الأسرار قبل الالتزام.",
    },
    body: "# Secrets Baseline\n\nAvoid committing secrets.\n",
    variables: [],
    references: [],
    scripts: [],
    sources: [],
    provenance: { source: "prototype" },
    ...overrides,
  } as GeneratedSkill;
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
    [".cursor/rules/x.mdc", "markdown"],
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

  it("includes the target path hint and registration note", () => {
    const bundle = buildAgentPrompt("claude-code", skills, [], "en");
    expect(bundle.text).toContain(".claude/skills/");
    expect(bundle.text.toLowerCase()).toContain("claude code auto-discovers");
  });

  it("renders every file under its own header with a fenced block", () => {
    const bundle = buildAgentPrompt("claude-code", skills, [], "en");
    const headerCount = (bundle.text.match(/^### File /gm) ?? []).length;
    expect(headerCount).toBe(bundle.fileCount);
    expect(bundle.text).toContain("```markdown");
  });

  it("emits Arabic copy when locale is ar", () => {
    const bundle = buildAgentPrompt("cursor", skills, [], "ar");
    expect(bundle.text).toContain("تثبيت");
    expect(bundle.text).toContain(".cursor/rules/");
  });

  it("warns codex/agents-md prompts to merge into AGENTS.md instead of overwriting", () => {
    const codex = buildAgentPrompt("codex", skills, [], "en");
    const generic = buildAgentPrompt("agents-md", skills, [], "en");
    expect(codex.text).toMatch(/DO NOT overwrite/);
    expect(codex.text).toContain("Wathba Skills");
    expect(generic.text).toMatch(/DO NOT overwrite/);
  });

  it("keeps the overwrite-on-collision rule for non-AGENTS.md targets", () => {
    const claude = buildAgentPrompt("claude-code", skills, [], "en");
    expect(claude.text).not.toMatch(/DO NOT overwrite/);
    expect(claude.text).toContain("overwrite");
  });

  it("bumps fence length when a file's content contains triple backticks", () => {
    const skill = makeSkill({
      body: "# x\n\n```bash\necho 1\n```\n",
    });
    const bundle = buildAgentPrompt("claude-code", [skill], [], "en");
    expect(bundle.text).toContain("````markdown");
  });
});
