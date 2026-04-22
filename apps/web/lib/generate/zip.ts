import JSZip from "jszip";

import {
  renderClaudeCodeFiles,
  type RenderedFile,
} from "@/lib/generate/adapters/claude-code";
import { renderAgentsMdFiles } from "@/lib/generate/adapters/agents-md";
import { renderCodexFiles } from "@/lib/generate/adapters/codex";
import { renderCursorFiles } from "@/lib/generate/adapters/cursor";
import { renderCursorRulesFiles } from "@/lib/generate/adapters/cursor-rules";
import type { FilePlan } from "@/lib/generate/file-plan";
import type { SkillResolution } from "@/lib/generate/resolve-markdown";
import type { GeneratedSkill } from "@/lib/skills/generated";
import type { TargetAgent } from "@/lib/skills/recommendations";

export function buildTargetFiles(
  target: TargetAgent,
  skills: readonly GeneratedSkill[],
  resolutions: readonly SkillResolution[],
): RenderedFile[] {
  if (skills.length === 0) return [];
  switch (target) {
    case "claude-code":
      return renderClaudeCodeFiles(skills, resolutions);
    case "cursor":
      // Ship both contracts under the Cursor target — `.cursor/rules/*.mdc`
      // (durable context) and `.cursor/skills/<slug>/SKILL.md` (Agent Skills
      // interop). See cursor-rules.ts for the verification caveat.
      return [
        ...renderCursorRulesFiles(skills),
        ...renderCursorFiles(skills, resolutions),
      ];
    case "codex":
      return renderCodexFiles(skills, resolutions);
    case "agents-md":
      return renderAgentsMdFiles(skills, resolutions);
  }
}

export function collectAllFiles(
  plan: FilePlan,
  skills: readonly GeneratedSkill[],
  resolutions: readonly SkillResolution[],
): RenderedFile[] {
  const files: RenderedFile[] = [];
  for (const target of plan.targets) {
    files.push(...buildTargetFiles(target.target, skills, resolutions));
  }
  return files;
}

function base64ToBytes(encoded: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js fallback (used in tests + SSR).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Buffer } = require("node:buffer") as typeof import("node:buffer");
  return Uint8Array.from(Buffer.from(encoded, "base64"));
}

export async function buildZipBlob(
  plan: FilePlan,
  skills: readonly GeneratedSkill[],
  resolutions: readonly SkillResolution[],
): Promise<Blob> {
  const zip = new JSZip();
  const files = collectAllFiles(plan, skills, resolutions);
  for (const file of files) {
    if (file.encoding === "base64") {
      zip.file(file.path, base64ToBytes(file.content), { binary: true });
    } else {
      zip.file(file.path, file.content);
    }
  }
  return zip.generateAsync({ type: "blob" });
}

export function formatZipDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildZipFilename(date: Date = new Date()): string {
  return `wathba-skills-${formatZipDate(date)}.zip`;
}
