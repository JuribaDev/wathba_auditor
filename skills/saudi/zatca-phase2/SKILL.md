# ZATCA Phase 2 E-Invoicing ({{stack}})

## When this skill activates

Use this skill whenever the work touches invoice generation, VAT handling, QR code generation, XML signing, ZATCA onboarding, or Fatoora integration for Saudi Arabia.

Also use it when the work touches credit notes, debit notes, invoice UUIDs, invoice counters, cryptographic stamps, CSIDs, certificate renewal, simplified tax invoice reporting, tax invoice clearance, or ERP/POS device onboarding.

## Compliance baseline

1. Distinguish clearly between clearance and reporting flows.
2. Treat B2B and B2G invoices as clearance documents that must be validated through the approved ZATCA flow before issuance.
3. Treat B2C and point-of-sale invoices as reporting documents and ensure they are reported within the required time window.
4. Do not treat this project as production-ready unless device onboarding, certificate handling, and XML validation have been planned explicitly.
5. Each E-Invoice Solution Unit must have an onboarding lifecycle: compliance CSID, production CSID, secret handling, renewal, revocation, and environment separation.
6. The invoice XML, UUID, invoice counter, previous invoice hash, QR code, cryptographic stamp, and submission response must be persisted as auditable artifacts.

## Operational warning

Do not assume a team can call ZATCA APIs immediately. A compliant rollout requires onboarding, credentials, certificates, environment setup, and validation against official schemas and implementation standards.

## Hard stops

- Do not invent ZATCA endpoints, headers, XML namespaces, signing algorithms, or QR formats. Use the current official Fatoora technical documents and sandbox credentials.
- Do not issue a B2B/B2G tax invoice as final until the clearance path returns an accepted response for that invoice.
- Do not allow manual edits to a signed invoice XML. Corrections must be credit/debit notes or an approved domain flow.
- Do not store CSID secrets, private keys, or certificate material in the repository, generated fixtures, logs, or support tickets.

## Stack guidance

### Node.js

- Prefer isolating XML generation and signing in a dedicated service module.
- Validate generated XML against the official schema before any outbound request.
- Keep certificate material outside the repository and load it from secure runtime configuration only.
- Use fixture tests for canonical XML, hash, QR, signing, clearance/reporting payloads, and error normalization.

### .NET

- Model invoice payloads as typed DTOs and keep serialization deterministic.
- Separate signing, QR generation, and transport concerns so each can be tested independently.
- Treat SDK usage as implementation detail; preserve a thin internal abstraction around ZATCA-specific flows.
- Persist each invoice submission attempt with request id, response code, invoice UUID, and environment.

### Python

- Keep XML construction and canonicalization deterministic and covered by fixture tests.
- Avoid mixing invoice domain logic with certificate parsing or transport code.
- Add regression fixtures for representative B2B and B2C invoices before integrating external calls.
- Use decimal arithmetic for VAT calculations and reject floats in invoice totals.

## Rollout guidance

- Treat ZATCA wave announcements as project inputs, not as code constants. A taxpayer's actual obligation is based on ZATCA notification and current official criteria.
- Separate sandbox, simulation/compliance, and production credentials. A passing compliance check is not production onboarding.
- Plan operational dashboards for rejected invoices, stale simplified-reporting queues, certificate expiry, clock drift, and sequence/hash gaps.

## Related skills

- Use `secrets-baseline` for CSIDs, certificate secrets, and private keys.
- Use `ci-hygiene` so XML/schema/signing fixtures run in CI.
- Use `testability-check` to isolate clock, UUID, sequence, XML signing, and transport clients.
- Use `pdpl-basics` when invoice customer fields contain personal data.

## Variables

- `stack={{stack}}`
- `invoice_volume={{invoice_volume}}`
- `has_pos={{has_pos}}`

## References

- Read `references/zatca-xml-sample.xml` for an example invoice structure.
- Use `scripts/validate-zatca-xml.mjs` as a local helper to check that a generated XML file is at least structurally present before deeper validation work.
