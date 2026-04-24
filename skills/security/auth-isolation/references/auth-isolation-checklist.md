# Auth Isolation Checklist

Use before merging a change that introduces, moves, or modifies a privileged code path.

## Routing

- [ ] Admin endpoints are on a distinct router, not mixed with user endpoints.
- [ ] The admin router has its own authentication middleware.
- [ ] No user endpoint reads an admin-only header as a soft escalation path.
- [ ] Admin CORS, cookies, CSRF policy, and rate limits are configured separately from user routes.

## Context

- [ ] Authenticated principal is available through a single explicit accessor.
- [ ] Domain code does not read session globals.
- [ ] Impersonation (acting on behalf of a user) is recorded with actor and reason.
- [ ] Tenant, organization, or resource scope is part of the authorization context and fails closed when missing.

## Auditing

- [ ] Privileged actions write an audit event with actor, target, and outcome.
- [ ] Audit log is not writable from user-accessible code paths.
- [ ] Failed privileged attempts are logged, not silently swallowed.
- [ ] Elevated sessions record actor, reason, target scope, start, expiry, and revocation.

## Negative tests

- [ ] A test asserts that a user session cannot reach an admin endpoint.
- [ ] A test asserts that an expired or revoked admin token is rejected.
- [ ] A test asserts that background-worker impersonation cannot be triggered over HTTP.
- [ ] A test asserts that changing tenant/account ids in a request does not cross authorization boundaries.
- [ ] A test asserts that UI feature flags do not grant server-side access.
