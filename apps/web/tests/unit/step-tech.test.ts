import { describe, expect, it } from "vitest";

import {
  TECH_AGENT_VALUES,
  TECH_SECRETS_VALUES,
  TECH_STACK_VALUES,
} from "@/components/questionnaire/step-tech";
import type {
  SecretsHandling,
  Stack,
  TargetAgent,
} from "@/lib/skills/recommendations";

describe("step-tech option constants", () => {
  it("exposes the five prototype stack options in order", () => {
    expect(TECH_STACK_VALUES).toEqual([
      "nodejs",
      "python",
      "php",
      "go",
      "other",
    ]);
  });

  it("exposes the four target agents in canonical order", () => {
    expect(TECH_AGENT_VALUES).toEqual([
      "claude-code",
      "cursor",
      "codex",
      "agents-md",
    ]);
  });

  it("exposes the four secrets handling options", () => {
    expect(TECH_SECRETS_VALUES).toEqual([
      "manager",
      "env",
      "dotenv",
      "none",
    ]);
  });

  it("constrains values to canonical recommendation unions", () => {
    const stacks: readonly Stack[] = TECH_STACK_VALUES;
    const agents: readonly TargetAgent[] = TECH_AGENT_VALUES;
    const secrets: readonly SecretsHandling[] = TECH_SECRETS_VALUES;
    expect(stacks.length).toBe(5);
    expect(agents.length).toBe(4);
    expect(secrets.length).toBe(4);
  });

  it("keeps 'manager' as the one secrets option that skips secrets-baseline", () => {
    expect(TECH_SECRETS_VALUES[0]).toBe("manager");
    expect(TECH_SECRETS_VALUES.includes("manager")).toBe(true);
  });
});
