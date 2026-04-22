---
name: auth-isolation
description: Separate admin code from user code and keep session contexts from bleeding. Cuts out a whole class of privilege-escalation leaks in agent-generated code.
---

# Auth Boundary Isolation

## When this skill activates

Use this skill whenever the work introduces privileged actions, admin dashboards, role-aware endpoints, background jobs that impersonate users, or any code path that must not be reachable by an unauthenticated caller.

## Baseline rules

1. Privileged code lives behind a single explicit boundary. Any code reachable on a user request path is treated as user code.
2. A request that authenticates a user never silently elevates to admin scope later in the same handler.
3. Background workers that act "as" a user declare the impersonation explicitly and log it.
4. Session identifiers, API tokens, and admin credentials are never interchangeable in middleware.

## Design patterns

### Dedicated admin surface

- Route admin endpoints through a distinct router mounted under a clearly named prefix.
- Give the admin surface its own middleware stack — not a flag on the user middleware.
- Deny by default. An endpoint that is not explicitly admin-allowed is not reachable through the admin surface.

### Context objects

- Build an explicit request context that carries the authenticated principal, the allowed scopes, and the session id.
- Pass the context object to business code. Do not read session globals from inside domain logic.
- Treat the context as immutable per request. Re-issuing a context means restarting the request.

### Privilege escalation

- Escalation is a discrete action with its own audit record — not an `if (admin)` branch buried in a handler.
- Require fresh authentication for destructive admin actions even inside an already-authenticated session.
- Rate-limit admin actions separately from user actions.

## Failure modes to flag

- A user endpoint that reads an admin token header "if present." That is not isolation.
- A shared middleware that uses `req.user.isAdmin` to toggle behavior on the same endpoint for different actors.
- Background jobs that fabricate a user object without referencing a real identity.
- Admin APIs proxied through user-facing CORS rules.

## References

- Read `references/auth-isolation-checklist.md` before merging a change that introduces an admin or privileged code path.

_Version: 0.3.0 · Last verified: 2026-02-14 · Status: community-maintained_

**Sources**

- [OWASP Access Control](https://owasp.org/www-community/Access_Control)
