import { describe, expect, it } from "vitest";

import {
  hasAnyError,
  validateAboutStep,
  validateTechStep,
  type ValidationMessages,
} from "@/lib/questionnaire/validation";

const MESSAGES: ValidationMessages = {
  market: "market required",
  pii: "pii required",
  invoicing: "invoicing required",
  payments: "payments required",
  identity: "identity required",
  stack: "stack required",
  agents: "agents required",
  ci: "ci required",
  secrets: "secrets required",
};

describe("validateAboutStep", () => {
  it("flags market and pii when empty", () => {
    const errors = validateAboutStep({}, MESSAGES);
    expect(errors.market).toBe(MESSAGES.market);
    expect(errors.pii).toBe(MESSAGES.pii);
    expect(errors.invoicing).toBeUndefined();
    expect(errors.payments).toBeUndefined();
    expect(errors.identity).toBeUndefined();
  });

  it("requires invoicing/payments/identity for ksa market", () => {
    const errors = validateAboutStep({ market: "ksa" }, MESSAGES);
    expect(errors.invoicing).toBe(MESSAGES.invoicing);
    expect(errors.payments).toBe(MESSAGES.payments);
    expect(errors.identity).toBe(MESSAGES.identity);
  });

  it("requires invoicing/payments/identity for gcc market", () => {
    const errors = validateAboutStep({ market: "gcc" }, MESSAGES);
    expect(errors.invoicing).toBe(MESSAGES.invoicing);
    expect(errors.payments).toBe(MESSAGES.payments);
    expect(errors.identity).toBe(MESSAGES.identity);
  });

  it("does not require ksa-only fields for global market", () => {
    const errors = validateAboutStep(
      { market: "global", pii: false },
      MESSAGES,
    );
    expect(errors.market).toBeUndefined();
    expect(errors.pii).toBeUndefined();
    expect(errors.invoicing).toBeUndefined();
    expect(errors.payments).toBeUndefined();
    expect(errors.identity).toBeUndefined();
  });

  it("still requires pii for global market", () => {
    const errors = validateAboutStep({ market: "global" }, MESSAGES);
    expect(errors.pii).toBe(MESSAGES.pii);
  });

  it("accepts false as a valid yes/no answer", () => {
    const errors = validateAboutStep(
      {
        market: "ksa",
        pii: false,
        invoicing: false,
        payments: false,
        identity: false,
      },
      MESSAGES,
    );
    expect(hasAnyError(errors)).toBe(false);
  });
});

describe("validateTechStep", () => {
  it("flags every required field when empty", () => {
    const errors = validateTechStep({}, MESSAGES);
    expect(errors.stack).toBe(MESSAGES.stack);
    expect(errors.agents).toBe(MESSAGES.agents);
    expect(errors.ci).toBe(MESSAGES.ci);
    expect(errors.secrets).toBe(MESSAGES.secrets);
  });

  it("treats empty agents array as missing", () => {
    const errors = validateTechStep({ agents: [] }, MESSAGES);
    expect(errors.agents).toBe(MESSAGES.agents);
  });

  it("passes when all tech fields are filled", () => {
    const errors = validateTechStep(
      {
        stack: "nodejs",
        agents: ["claude-code"],
        ci: true,
        secrets: "manager",
      },
      MESSAGES,
    );
    expect(hasAnyError(errors)).toBe(false);
  });
});

describe("hasAnyError", () => {
  it("returns false for empty errors", () => {
    expect(hasAnyError({})).toBe(false);
  });

  it("returns true when any field has a message", () => {
    expect(hasAnyError({ market: "x" })).toBe(true);
  });
});
