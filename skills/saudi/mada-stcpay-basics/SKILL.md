# mada and STC Pay Payment Basics ({{stack}})

## When this skill activates

Use this skill whenever the work touches card acceptance, wallet acceptance, refunds, settlement reconciliation, or chargeback handling for users paying from Saudi Arabia.

Also use it when the work touches payment service user disclosures, transaction limits, payment credentials, wallet balances, payment webhooks, or payment status dashboards for Saudi users.

## Compliance baseline

1. mada is the Saudi national debit scheme. A card that is technically accepted by Visa or Mastercard acquiring is not automatically a mada-accepted card.
2. Flows built only against international test cards will miss real-world mada behavior. Plan for mada BIN ranges in test fixtures.
3. STC Pay is a wallet, not a card rail. Treat it as a separate payment method with its own status lifecycle.
4. Currency is always SAR for domestic flows. Do not assume USD fallbacks work for Saudi-local transactions.
5. Payment-service flows must expose clear fees, execution timing, transaction references, and failure states before or immediately after execution as applicable.
6. Do not store personalized security credentials, wallet secrets, OTPs, or PSP webhook secrets outside a secret manager or approved payment vault.

## Operational warning

This skill is engineering guidance, not legal or scheme compliance advice. Card scheme rules, PCI DSS obligations, and central bank oversight still apply; do not treat this skill as a substitute for the acquirer's own integration contract.

## Hard stops

- Do not ship a Saudi payment flow without idempotency keys on authorization, capture, refund, and webhook processing.
- Do not treat a PSP callback as trusted until its signature, timestamp, replay window, and expected merchant account are verified.
- Do not mutate balances directly from checkout handlers; write payment events and reconcile them.
- Do not hide fees, FX, or execution timing in logs or PSP metadata only. They must be represented in product-visible state where required.

## Stack guidance

### Node.js

- Model the payment method (`mada`, `visa`, `mastercard`, `stc_pay`) as an explicit field alongside the PSP's own method label.
- Keep 3DS step-up handling idempotent so a browser refresh mid-challenge cannot double-charge.
- Normalize PSP webhook payloads into a local payment state machine before persisting.
- Validate webhook signatures with a constant-time comparison and reject stale timestamps.

### .NET

- Treat settlement reconciliation as a separate worker. Do not mix it with the checkout request path.
- Use typed enums for payment status (`pending`, `authorized`, `captured`, `refunded`, `failed`) to avoid divergent spellings across services.
- Log the PSP's transaction id and the internal payment id together so failed reconciliations are traceable.
- Store amounts as integer minor units and reject currency changes after authorization intent is created.

### Python

- Wrap the PSP SDK in a repository adapter so retry, idempotency, and signature verification live in one place.
- Capture the intended amount, currency, and method at authorization time. Later status changes should be validated against this stored intent.
- For refunds, always resolve the authorization reference from internal state rather than trusting the client input.
- Model asynchronous wallet completion as a pending state with an expiry policy, not as a checkout exception.

### PHP

- Prefer HTTP client abstractions that surface both status code and response body so PSP-specific error codes are not lost in generic exceptions.
- Keep webhook endpoints lean. Defer business side-effects to a queue so a webhook retry storm does not rewrite user-visible state.
- Use server-stored correlation ids on every payment — not client-provided ids.

### Java

- Treat the PSP SDK as infrastructure behind a port. Application logic should depend on the port, not on the vendor type.
- Use a dedicated ledger table for payment events. The checkout endpoint should write events, not mutate balances directly.
- Keep transaction amounts in the smallest currency unit and avoid floating-point arithmetic.
- Keep reconciliation imports append-only; corrections are new events, not rewrites of settled history.

### Go

- Model the payment flow with explicit state transitions. A reviewer should be able to read the state machine in one file.
- Validate webhook signatures with constant-time comparison.
- Keep HTTP handler code free of PSP-specific branching; feed a single domain command into your application layer.
- Use contexts for PSP timeouts, but do not cancel durable reconciliation work when the user request disconnects.

## Common pitfalls

- Assuming 3DS behavior is identical for international cards and mada BINs.
- Treating STC Pay confirmation latency as a bug instead of an expected async completion.
- Relying on wall-clock time for reconciliation windows across environments.
- Accepting client-provided refund references, payment method labels, or paid amounts.
- Treating authorization, capture, settlement, refund, and chargeback as one mutable status instead of auditable events.

## Related skills

- Use `secrets-baseline` for PSP keys, webhook secrets, and payment-signing credentials.
- Use `pdpl-basics` for payment identifiers, cardholder metadata, wallet identifiers, and support exports.
- Use `testability-check` for fake PSP clients, deterministic clocks, and webhook replay tests.

## Variables

- `stack={{stack}}`
