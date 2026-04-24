# PDPL Engineering Checklist

Use this checklist before merging a change that reads, writes, exports, or deletes personal data.

## Collection

- [ ] Every new personal data field has a recorded purpose and retention period.
- [ ] The change does not capture identifiers the feature does not use.
- [ ] Consent state is read from a single source of truth, not inferred.
- [ ] Sensitive data, national ID/Iqama, precise location, health data, credit data, and payment identifiers have explicit review before collection.
- [ ] Direct marketing, profiling, and consent-dependent features are disabled when consent is absent or withdrawn.

## Storage

- [ ] Personal data is segregated from operational telemetry.
- [ ] Backups and replicas are inside the same trust boundary as the primary store.
- [ ] Retention fields are respected by a scheduled cleanup job that is monitored.
- [ ] Processing records name purpose, data categories, recipients, transfer destinations, retention, and protection measures.
- [ ] Foreign processors or regions are documented with a transfer assessment and a minimum-data justification.

## Access

- [ ] Access to personal data is logged with actor, purpose, and timestamp.
- [ ] Admin tooling does not expose raw personal data unless the role requires it.
- [ ] Third-party processors of personal data are covered by a data processing agreement.
- [ ] Support exports and admin views are authorized separately from normal user sessions.

## Rights

- [ ] A user can request an export of their personal data through an internal path.
- [ ] A user can request deletion, and the deletion reaches backups, indexes, caches, and downstream warehouses.
- [ ] A user can correct stale personal data through a first-class code path.
- [ ] Data-subject requests have an owner, status, evidence trail, and completion timestamp.

## Incidents

- [ ] Personal data breach handling has named detection, escalation, containment, notification, and evidence-retention steps.
- [ ] Logs and alert payloads do not copy raw personal data while reporting the incident.
