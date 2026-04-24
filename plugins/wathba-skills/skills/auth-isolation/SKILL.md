---
name: auth-isolation
description: Separate admin code from user code and keep session contexts from bleeding. Cuts out a whole class of privilege-escalation leaks in agent-generated code.
---

# Auth Boundary Isolation

## When this skill activates

Use this skill whenever the work introduces privileged actions, admin dashboards, role-aware endpoints, background jobs that impersonate users, or any code path that must not be reachable by an unauthenticated caller.

Also use it when a user-facing flow starts reading admin headers, service tokens, support roles, feature flags, tenant ids, organization ids, or account-linking state.

## Baseline rules

1. Privileged code lives behind a single explicit boundary. Any code reachable on a user request path is treated as user code.
2. A request that authenticates a user never silently elevates to admin scope later in the same handler.
3. Background workers that act "as" a user declare the impersonation explicitly and log it.
4. Session identifiers, API tokens, and admin credentials are never interchangeable in middleware.
5. Access control is deny-by-default and checked server-side on every privileged action, not only in navigation or client state.
6. Authorization decisions must include subject, action, resource, tenant/scope, and reason. Role names alone are not enough for sensitive operations.

## Design patterns

### Dedicated admin surface

- Route admin endpoints through a distinct router mounted under a clearly named prefix.
- Give the admin surface its own middleware stack — not a flag on the user middleware.
- Deny by default. An endpoint that is not explicitly admin-allowed is not reachable through the admin surface.
- Keep admin CORS, cookie, session, CSRF, and rate-limit policy separate from user-facing routes.

### Context objects

- Build an explicit request context that carries the authenticated principal, the allowed scopes, and the session id.
- Pass the context object to business code. Do not read session globals from inside domain logic.
- Treat the context as immutable per request. Re-issuing a context means restarting the request.
- Include tenant or organization scope in the context. Missing scope should fail closed.

### Privilege escalation

- Escalation is a discrete action with its own audit record — not an `if (admin)` branch buried in a handler.
- Require fresh authentication for destructive admin actions even inside an already-authenticated session.
- Rate-limit admin actions separately from user actions.
- Expire elevated sessions quickly and bind them to the actor, device/session, reason, and target scope.

## Failure modes to flag

- A user endpoint that reads an admin token header "if present." That is not isolation.
- A shared middleware that uses `req.user.isAdmin` to toggle behavior on the same endpoint for different actors.
- Background jobs that fabricate a user object without referencing a real identity.
- Admin APIs proxied through user-facing CORS rules.
- Tenant or account ids accepted from the client without checking that the principal can access that resource.
- Feature flags used as authorization controls.
- Support impersonation that can be triggered from a normal browser session without a separate audit path.

## Required tests

- A normal user cannot reach every admin route, even by changing headers, tenant ids, or request body scope.
- An admin without the required resource scope is rejected.
- Expired, revoked, or downgraded sessions cannot reuse cached authorization.
- Impersonation records actor, target, reason, start, end, and outcome.

## Related skills

- Use `secrets-baseline` when admin tokens, service credentials, or signing keys are introduced.
- Use `pdpl-basics` when privileged users can view, export, correct, or delete personal data.

## References

- Read `references/auth-isolation-checklist.md` before merging a change that introduces an admin or privileged code path.

_Version: 0.4.0 · Last verified: 2026-04-24 · Status: community-maintained_

**Sources**

- [OWASP Access Control](https://owasp.org/www-community/Access_Control)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
