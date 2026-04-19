import { describe, expect, it } from "vitest";

import {
  SAMPLE_PREVIEW_BODIES,
  resolveActiveTarget,
} from "@/lib/generate/sample-previews";
import type { TargetAgent } from "@/lib/skills/recommendations";

describe("resolveActiveTarget", () => {
  it("returns null when no targets are available", () => {
    expect(resolveActiveTarget([], null)).toBeNull();
    expect(resolveActiveTarget([], "claude-code")).toBeNull();
  });

  it("returns the first available target when current is null", () => {
    expect(resolveActiveTarget(["claude-code", "cursor"], null)).toBe(
      "claude-code",
    );
  });

  it("keeps the current target when it is still available", () => {
    expect(resolveActiveTarget(["claude-code", "cursor"], "cursor")).toBe(
      "cursor",
    );
  });

  it("falls back to the first available target when the current is no longer selected", () => {
    expect(resolveActiveTarget(["codex", "agents-md"], "cursor")).toBe("codex");
  });
});

describe("SAMPLE_PREVIEW_BODIES", () => {
  it("provides a non-empty preview for every target agent", () => {
    const targets: TargetAgent[] = [
      "claude-code",
      "cursor",
      "codex",
      "agents-md",
    ];
    for (const target of targets) {
      expect(SAMPLE_PREVIEW_BODIES[target]).toBeTruthy();
      expect(SAMPLE_PREVIEW_BODIES[target].length).toBeGreaterThan(20);
    }
  });
});
