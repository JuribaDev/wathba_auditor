"use client";

import * as React from "react";

import { RadioCardGroup, type RadioCardOption } from "@/components/ui/radio-card";
import type {
  Market,
  QuestionnaireAnswers,
} from "@/lib/skills/recommendations";

import { Question } from "./question";
import { YesNoGroup } from "./yes-no-group";

export type AboutStepLabels = {
  marketTitle: string;
  marketDesc: string;
  marketWhy: string;
  marketOptionKsaLabel: string;
  marketOptionKsaDesc: string;
  marketOptionGccLabel: string;
  marketOptionGccDesc: string;
  marketOptionGlobalLabel: string;
  marketOptionGlobalDesc: string;
  invoicingTitle: string;
  invoicingDesc: string;
  invoicingWhy: string;
  piiTitle: string;
  piiDesc: string;
  piiWhy: string;
  paymentsTitle: string;
  paymentsDesc: string;
  paymentsWhy: string;
  identityTitle: string;
  identityDesc: string;
  identityWhy: string;
  yes: string;
  no: string;
  whyAsk: string;
};

export function isKsaMarket(
  market: Market | undefined | null,
): boolean {
  return market === "ksa" || market === "gcc";
}

type StepAboutProps = {
  answers: QuestionnaireAnswers;
  onChange: (patch: Partial<QuestionnaireAnswers>) => void;
  labels: AboutStepLabels;
};

export function StepAbout({ answers, onChange, labels }: StepAboutProps) {
  const ksa = isKsaMarket(answers.market);

  const marketOptions: RadioCardOption[] = [
    {
      value: "ksa",
      label: labels.marketOptionKsaLabel,
      description: labels.marketOptionKsaDesc,
    },
    {
      value: "gcc",
      label: labels.marketOptionGccLabel,
      description: labels.marketOptionGccDesc,
    },
    {
      value: "global",
      label: labels.marketOptionGlobalLabel,
      description: labels.marketOptionGlobalDesc,
    },
  ];

  return (
    <div className="flex flex-col gap-8" data-slot="step-about">
      <Question
        title={labels.marketTitle}
        description={labels.marketDesc}
        why={labels.marketWhy}
        whyAskLabel={labels.whyAsk}
      >
        <RadioCardGroup
          name="market"
          aria-label={labels.marketTitle}
          value={answers.market ?? null}
          onValueChange={(value) => onChange({ market: value as Market })}
          options={marketOptions}
        />
      </Question>

      {ksa ? (
        <Question
          title={labels.invoicingTitle}
          description={labels.invoicingDesc}
          why={labels.invoicingWhy}
          whyAskLabel={labels.whyAsk}
        >
          <YesNoGroup
            name="invoicing"
            ariaLabel={labels.invoicingTitle}
            value={answers.invoicing}
            onValueChange={(value) => onChange({ invoicing: value })}
            yesLabel={labels.yes}
            noLabel={labels.no}
          />
        </Question>
      ) : null}

      <Question
        title={labels.piiTitle}
        description={labels.piiDesc}
        why={labels.piiWhy}
        whyAskLabel={labels.whyAsk}
      >
        <YesNoGroup
          name="pii"
          ariaLabel={labels.piiTitle}
          value={answers.pii}
          onValueChange={(value) => onChange({ pii: value })}
          yesLabel={labels.yes}
          noLabel={labels.no}
        />
      </Question>

      {ksa ? (
        <>
          <Question
            title={labels.paymentsTitle}
            description={labels.paymentsDesc}
            why={labels.paymentsWhy}
            whyAskLabel={labels.whyAsk}
          >
            <YesNoGroup
              name="payments"
              ariaLabel={labels.paymentsTitle}
              value={answers.payments}
              onValueChange={(value) => onChange({ payments: value })}
              yesLabel={labels.yes}
              noLabel={labels.no}
            />
          </Question>

          <Question
            title={labels.identityTitle}
            description={labels.identityDesc}
            why={labels.identityWhy}
            whyAskLabel={labels.whyAsk}
          >
            <YesNoGroup
              name="identity"
              ariaLabel={labels.identityTitle}
              value={answers.identity}
              onValueChange={(value) => onChange({ identity: value })}
              yesLabel={labels.yes}
              noLabel={labels.no}
            />
          </Question>
        </>
      ) : null}
    </div>
  );
}
