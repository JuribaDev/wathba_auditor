---
name: zatca-phase2
description: "Engineering guardrails for ZATCA Phase 2 invoicing — XML structure, signing flow, and onboarding steps an AI agent should respect before it writes code."
---

# ZATCA Phase 2 E-Invoicing ({{stack}})

## When this skill activates

Use this skill whenever the work touches invoice generation, VAT handling, QR code generation, XML signing, ZATCA onboarding, or Fatoora integration for Saudi Arabia.

## Compliance baseline

1. Distinguish clearly between clearance and reporting flows.
2. Treat B2B and B2G invoices as clearance documents that must be validated through the approved ZATCA flow before issuance.
3. Treat B2C and point-of-sale invoices as reporting documents and ensure they are reported within the required time window.
4. Do not treat this project as production-ready unless device onboarding, certificate handling, and XML validation have been planned explicitly.

## Operational warning

Do not assume a team can call ZATCA APIs immediately. A compliant rollout requires onboarding, credentials, certificates, environment setup, and validation against official schemas and implementation standards.

## Stack guidance

### Node.js

- Prefer isolating XML generation and signing in a dedicated service module.
- Validate generated XML against the official schema before any outbound request.
- Keep certificate material outside the repository and load it from secure runtime configuration only.

### .NET

- Model invoice payloads as typed DTOs and keep serialization deterministic.
- Separate signing, QR generation, and transport concerns so each can be tested independently.
- Treat SDK usage as implementation detail; preserve a thin internal abstraction around ZATCA-specific flows.

### Python

- Keep XML construction and canonicalization deterministic and covered by fixture tests.
- Avoid mixing invoice domain logic with certificate parsing or transport code.
- Add regression fixtures for representative B2B and B2C invoices before integrating external calls.

## Variables

- `stack={{stack}}`
- `invoice_volume={{invoice_volume}}`
- `has_pos={{has_pos}}`

## References

- Read `references/zatca-xml-sample.xml` for an example invoice structure.
- Use `scripts/validate-zatca-xml.mjs` as a local helper to check that a generated XML file is at least structurally present before deeper validation work.

_Version: 0.1.1 · Last verified: 2026-04-15 · Status: draft_

> Engineering guidance, not legal advice. Verify each rule against the official sources below.

**Sources**

- [ZATCA Fatoora Developer Portal](https://fatoora.zatca.gov.sa/)
- [ZATCA XML Implementation Standard](https://zatca.gov.sa/)
