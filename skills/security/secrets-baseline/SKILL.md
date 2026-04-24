# Secrets Baseline ({{manager}})

## When this skill activates

Use this skill whenever the work introduces credentials, API tokens, signing keys, database passwords, or webhook secrets — and whenever a reviewer notices raw secrets drifting into code, tests, or CI configuration.

Also use it when the work touches encryption keys, certificate private keys, ZATCA CSID secrets, PSP webhook secrets, OAuth client secrets, mobile app signing material, CI variables, deployment manifests, Terraform state, or `.env*` files.

## Baseline rules

1. Secrets never enter the repository in plaintext, not even "temporarily."
2. Secrets never enter commit messages, issue comments, or pull request descriptions.
3. Secrets never enter logs. Redact at the logger, not the log viewer.
4. A leaked secret is assumed compromised and rotated, not re-committed with `.gitignore`.
5. Secrets are scoped by environment and purpose. A development credential must not work in production, and a read-only token must not be reusable as an admin token.
6. Prefer short-lived credentials or workload identity over long-lived static tokens when the platform supports it.

## Environment files

- Keep a checked-in `.env.example` that lists every required key with a placeholder value.
- Keep the real `.env` out of the repository and out of container images.
- Do not parse `.env` in production code paths — production runtime should receive environment variables from the orchestrator or secret manager.

## Secret manager integration ({{manager}})

- Retrieve secrets at process start, not on every request.
- Cache secrets in memory within the process; never write them to disk or shared volumes.
- When the manager rotates a secret, fail fast rather than silently using a stale value.
- Separate application secrets from CI/CD secrets. Build jobs should only receive the secrets needed for that job and environment.
- Do not expose secrets to untrusted pull request workflows, preview builds, or client-side bundles.

## If a secret has been committed

1. Rotate the secret at the issuer immediately. Removing it from the repo is not rotation.
2. Revoke any tokens the secret could have minted.
3. Scrub the secret from git history only after rotation. History rewrites are a hygiene step, not a remediation.
4. Add a detection rule so the same kind of leak is caught before merge next time.
5. Search logs, crash reports, build artifacts, package registries, container layers, and shared screenshots for secondary exposure.

## Developer workflow

- Run a local secret scanner on staged changes. Treat findings as blocking, not advisory.
- Never ask an AI agent to paste a real secret for debugging — use a redacted example.
- Treat `.env.local`, `.env.development`, and other dotfile variants with the same seriousness as `.env`.
- Keep `.env.example` realistic about key names but fake in values. Use values like `replace-me`, never examples that look like live keys.
- Add regression tests or scanner rules for provider-specific secret formats introduced by the change.

## Related skills

- Use `ci-hygiene` for environment-scoped CI secrets, protected deploy jobs, and pinned actions.
- Use `auth-isolation` when secrets could be confused with user sessions or admin credentials.
- Use Saudi compliance skills when the secret unlocks ZATCA, payment, identity, or personal-data systems.

## Variables

- `manager={{manager}}`

## References

- Run `scripts/scan-for-secrets.mjs` before committing a change that touches configuration, deployment, or auth code.
