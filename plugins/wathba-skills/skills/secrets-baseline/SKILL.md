---
name: secrets-baseline
description: "Keep secrets out of the repository and the commit history. Stack-agnostic rules on env file hygiene, manager integration, and rotating committed secrets."
---

# Secrets Baseline ({{manager}})

## When this skill activates

Use this skill whenever the work introduces credentials, API tokens, signing keys, database passwords, or webhook secrets — and whenever a reviewer notices raw secrets drifting into code, tests, or CI configuration.

## Baseline rules

1. Secrets never enter the repository in plaintext, not even "temporarily."
2. Secrets never enter commit messages, issue comments, or pull request descriptions.
3. Secrets never enter logs. Redact at the logger, not the log viewer.
4. A leaked secret is assumed compromised and rotated, not re-committed with `.gitignore`.

## Environment files

- Keep a checked-in `.env.example` that lists every required key with a placeholder value.
- Keep the real `.env` out of the repository and out of container images.
- Do not parse `.env` in production code paths — production runtime should receive environment variables from the orchestrator or secret manager.

## Secret manager integration ({{manager}})

- Retrieve secrets at process start, not on every request.
- Cache secrets in memory within the process; never write them to disk or shared volumes.
- When the manager rotates a secret, fail fast rather than silently using a stale value.

## If a secret has been committed

1. Rotate the secret at the issuer immediately. Removing it from the repo is not rotation.
2. Revoke any tokens the secret could have minted.
3. Scrub the secret from git history only after rotation. History rewrites are a hygiene step, not a remediation.
4. Add a detection rule so the same kind of leak is caught before merge next time.

## Developer workflow

- Run a local secret scanner on staged changes. Treat findings as blocking, not advisory.
- Never ask an AI agent to paste a real secret for debugging — use a redacted example.
- Treat `.env.local`, `.env.development`, and other dotfile variants with the same seriousness as `.env`.

## Variables

- `manager={{manager}}`

## References

- Run `scripts/scan-for-secrets.mjs` before committing a change that touches configuration, deployment, or auth code.

_Version: 1.0.0 · Last verified: 2026-03-02 · Status: maintainer-reviewed_

**Sources**

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
