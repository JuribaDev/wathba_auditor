import type { QuestionnaireAnswers } from "@/lib/skills/recommendations";

export type AboutStepErrorField =
  | "market"
  | "pii"
  | "invoicing"
  | "payments"
  | "identity";

export type TechStepErrorField = "stack" | "agents" | "ci" | "secrets";

export type AboutStepErrors = Partial<Record<AboutStepErrorField, string>>;
export type TechStepErrors = Partial<Record<TechStepErrorField, string>>;

export type ValidationMessages = {
  market: string;
  pii: string;
  invoicing: string;
  payments: string;
  identity: string;
  stack: string;
  agents: string;
  ci: string;
  secrets: string;
};

function isKsaMarket(market: QuestionnaireAnswers["market"]): boolean {
  return market === "ksa" || market === "gcc";
}

export function validateAboutStep(
  answers: QuestionnaireAnswers,
  messages: ValidationMessages,
): AboutStepErrors {
  const errors: AboutStepErrors = {};

  if (!answers.market) {
    errors.market = messages.market;
  }
  if (typeof answers.pii !== "boolean") {
    errors.pii = messages.pii;
  }
  if (isKsaMarket(answers.market)) {
    if (typeof answers.invoicing !== "boolean") {
      errors.invoicing = messages.invoicing;
    }
    if (typeof answers.payments !== "boolean") {
      errors.payments = messages.payments;
    }
    if (typeof answers.identity !== "boolean") {
      errors.identity = messages.identity;
    }
  }

  return errors;
}

export function validateTechStep(
  answers: QuestionnaireAnswers,
  messages: ValidationMessages,
): TechStepErrors {
  const errors: TechStepErrors = {};

  if (!answers.stack) {
    errors.stack = messages.stack;
  }
  if (!answers.agents || answers.agents.length === 0) {
    errors.agents = messages.agents;
  }
  if (typeof answers.ci !== "boolean") {
    errors.ci = messages.ci;
  }
  if (!answers.secrets) {
    errors.secrets = messages.secrets;
  }

  return errors;
}

export function hasAnyError(
  errors: AboutStepErrors | TechStepErrors,
): boolean {
  return Object.values(errors).some(Boolean);
}
