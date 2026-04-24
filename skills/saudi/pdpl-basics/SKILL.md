# PDPL Basics for Engineers

## When this skill activates

Use this skill whenever the work touches storage, logging, export, deletion, or sharing of personal data belonging to users in Saudi Arabia.

Also use this skill when the work introduces analytics, support tooling, identity verification, payment records, backups, search indexing, AI processing, or cross-border infrastructure that can process Saudi personal data.

## Compliance baseline

1. Treat any identifier that ties a record to a real person as personal data — names, emails, phone numbers, national IDs, device identifiers, and precise location all qualify.
2. Collect only the personal data the current feature genuinely needs. If a field is not used downstream, it should not be captured or persisted.
3. Record a clear purpose and a retention duration for every personal data field stored by the system.
4. Make deletion and export of a user's personal data a first-class capability, not a manual database query.
5. Maintain processing records for personal data stores: controller contact, purpose, data categories, recipients, transfer destinations, retention, and protection measures.
6. Treat health, credit, national identity, biometrics, precise location, and payment identifiers as higher-risk data that require explicit review before collection, logging, or sharing.

## Operational warning

This skill is engineering guidance, not legal advice. Treat it as a checklist the agent applies while writing code, and route statutory questions to a qualified lawyer.

## Engineering guidance

### Consent and purpose

- Record the lawful basis and purpose beside the personal data, not in a separate document the code cannot see.
- Do not silently widen the use of personal data collected for one purpose to cover a new one.
- When a feature depends on consent, treat missing consent as a disabled feature rather than a default-on behavior.
- For direct marketing, consent, profiling, or sensitive-data processing, require an explicit product/legal decision before implementing default-on behavior.

### Retention and minimization

- Prefer structured retention fields (`expires_at`, `delete_after`) over ad hoc cron jobs and manual cleanup.
- Avoid logging full personal data payloads; log identifiers and shape only.
- Separate operational telemetry from identity-bearing records so analytics do not accumulate long-term personal data by accident.
- If data leaves Saudi Arabia or is processed by a foreign vendor, require an explicit transfer assessment and record the destination, processor, purpose, and minimum data set.

### Export and deletion

- Expose a single internal path that produces a user's full export. Downstream duplicates should read from that path.
- When deleting, distinguish soft deletion (tombstone for audit) from hard deletion (PDPL obligation). Document which one a given code path performs.
- Verify that backups, search indexes, analytics warehouses, and caches honor deletion requests, not just the primary database.

### Breach and accountability

- Treat personal data breach handling as a product capability: detection, containment, authority notification path, affected-user notification path, and evidence retention must be named.
- If the organization has or needs a personal data protection officer, route impact assessments, breach handling, and data-subject requests through that owner.
- Keep audit events useful without embedding raw personal data. Log actor, purpose, target record id, outcome, and timestamp.

## Related skills

- Use `secrets-baseline` when personal data protection depends on API keys, encryption keys, webhook secrets, or database credentials.
- Use `auth-isolation` when admin/support users can view, export, correct, or delete personal data.
- Use `nafath-yakeen-basics` when national IDs, Iqama numbers, or government-backed identity signals are involved.

## References

- Read `references/pdpl-engineering-checklist.md` for a one-page checklist the agent can walk through before merging a change that touches personal data.
