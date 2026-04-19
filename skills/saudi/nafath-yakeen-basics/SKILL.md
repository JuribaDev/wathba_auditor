# Nafath and Yakeen Identity Onboarding

## When this skill activates

Use this skill whenever the work proposes verifying a Saudi citizen or resident identity, issuing a government-backed trust decision, or linking an account to a national ID.

## Operational warning

Do not generate client code against imagined Nafath or Yakeen endpoints. Neither service offers open self-service API keys. Integration requires an approval workflow, sponsor-bound credentials, and sandbox onboarding. Treat any unreferenced URL or token as a fabrication until a human confirms it.

## Compliance baseline

1. Identity verification is an onboarding concern that must be planned before coding — not a library to drop in.
2. Nafath provides authentication signals; it does not provide arbitrary citizen data.
3. Yakeen provides attribute verification through authorized service providers — treat it as a data lookup gated by contractual scope, not an open directory.
4. National IDs and Iqama numbers are personal data. PDPL rules from `pdpl-basics` apply in addition to this skill.

## Engineering guidance

### Before writing code

- Confirm the business has, or is actively obtaining, a Nafath or Yakeen engagement. If not, stop and route the team to apply before sprinting on code.
- Name the authorized service provider or government channel being used. Generic "call Nafath" stories are a red flag.
- Specify which attributes are actually required. Most flows need a verified identity signal, not a full profile.

### While integrating

- Keep credentials out of the repository. Reuse the guidance in `secrets-baseline` for handling and rotation.
- Isolate the identity provider client behind a thin adapter so test fixtures, error handling, and retries do not leak into feature code.
- Never cache raw identity attributes longer than the flow that needs them. Store the verification outcome, not the source attributes, whenever possible.

### Error and fallback handling

- Treat a failed identity verification as a hard stop for the privileged flow. Do not silently fall back to an unverified path.
- Provide a clear user-facing message in both Arabic and English explaining that verification is pending or rejected.
- Log identity decisions with enough context to audit, but without embedding the raw national ID in application logs.

## References

- Read `references/nafath-yakeen-approval-steps.md` for the approval and onboarding sequence.
- Read `references/nafath-yakeen-do-not.md` for common hallucinations to flag in generated code.
