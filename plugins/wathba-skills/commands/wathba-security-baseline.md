---
description: Run Wathba's security-baseline audit — auth isolation and secrets hygiene — across the current code.
argument-hint: [path-or-file]
---

Run a security baseline audit using the Wathba security skills
(auth-isolation, secrets-baseline).

Check for:
- Authentication boundaries (session store, token handling, refresh flows)
- Authorization gates on every mutating endpoint
- Secret surfaces: env files, build outputs, client bundles, logs, error
  responses, backup artifacts
- Rotation and revocation paths

Produce a concrete findings list with file:line citations, severity, and the
exact remediation from the relevant skill's checklist.

Target: ${ARGUMENTS:-the current working tree}
