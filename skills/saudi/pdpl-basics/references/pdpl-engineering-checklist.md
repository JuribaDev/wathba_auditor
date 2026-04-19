# PDPL Engineering Checklist

Use this checklist before merging a change that reads, writes, exports, or deletes personal data.

## Collection

- [ ] Every new personal data field has a recorded purpose and retention period.
- [ ] The change does not capture identifiers the feature does not use.
- [ ] Consent state is read from a single source of truth, not inferred.

## Storage

- [ ] Personal data is segregated from operational telemetry.
- [ ] Backups and replicas are inside the same trust boundary as the primary store.
- [ ] Retention fields are respected by a scheduled cleanup job that is monitored.

## Access

- [ ] Access to personal data is logged with actor, purpose, and timestamp.
- [ ] Admin tooling does not expose raw personal data unless the role requires it.
- [ ] Third-party processors of personal data are covered by a data processing agreement.

## Rights

- [ ] A user can request an export of their personal data through an internal path.
- [ ] A user can request deletion, and the deletion reaches backups, indexes, caches, and downstream warehouses.
- [ ] A user can correct stale personal data through a first-class code path.
