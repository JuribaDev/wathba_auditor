# Nafath and Yakeen Approval Steps

This is a rough roadmap, not a legal filing. Confirm the current steps with the relevant authority before committing to a timeline.

## 1. Identify the channel

- Nafath integrations are typically routed through an authorized government portal or through the entity's own sponsor agreement.
- Yakeen/Yaqeen integrations are routed through authorized service providers such as Elm or through a sector-specific approved path.
- Name the sponsor, provider, contract owner, and support contact before estimating engineering delivery.

## 2. Submit a formal request

- Describe the use case, the attributes required, and the user impact if verification fails.
- Provide a security and privacy overview covering how credentials, tokens, and returned attributes will be stored.
- Document the minimum attributes required and the data-retention policy for both raw provider responses and durable verification decisions.

## 3. Sandbox onboarding

- Receive sandbox credentials and test against documented mocked flows.
- Do not treat sandbox responses as production-shaped unless the provider confirms parity.
- Build provider contract tests from the approved sandbox documentation, not from public blog posts or guessed examples.

## 4. Production clearance

- Production credentials are bound to the sponsor and are not portable across environments without explicit approval.
- Credential rotation must be planned up front; do not assume long-lived keys.
- Confirm callback domains, IP allowlists, certificates, rate limits, maintenance contacts, and incident channels before go-live.

## 5. Ongoing obligations

- Monitor for service announcements — endpoints and scopes can be adjusted by the authority.
- Keep a contact person on the business side who owns the relationship, not just the engineer who integrated.
- Review verification outcome retention, re-verification triggers, support overrides, and failed-attempt reporting after launch.
