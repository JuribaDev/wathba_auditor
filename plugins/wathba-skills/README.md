# wathba-skills

Production-grade Saudi compliance, security, and architecture skills for agent-assisted engineering (ZATCA Phase 2, PDPL, Nafath/Yakeen, mada/STC Pay, auth isolation, secrets baseline, testability, CI hygiene).

This directory is **generated** from `skills/<category>/<slug>/` in the
parent repo. Do not hand-edit — see `docs/development.md`.

## Install

```
/plugin marketplace add JuribaDev/wathba_auditor
/plugin install wathba-skills@wathba
```

See `docs/installation.md` for local-development install and non-Claude
targets (Cursor, Codex, offline).

## Commands

- `/wathba-architecture-audit`
- `/wathba-compliance-review`
- `/wathba-install-guide`
- `/wathba-security-baseline`
- `/wathba-skill-list`

## Skills (8)

- **auth-isolation** (security, v0.4.0) — Separate admin code from user code and keep session contexts from bleeding. Cuts out a whole class of privilege-escalation leaks in agent-generated code.
- **ci-hygiene** (architecture, v0.6.0) — If the repo has no CI the agent adds one. If it does the agent keeps it honest — lint, typecheck, tests, and migration hygiene as rules the agent can actually enforce.
- **mada-stcpay-basics** (compliance · region saudi-arabia, v0.3.0) — Practical integration notes for Saudi-local payment rails — BIN handling, 3DS quirks, settlement expectations, and common pitfalls generic payment tutorials miss.
- **nafath-yakeen-basics** (compliance · region saudi-arabia, v0.2.0) — Keep the agent from inventing fake Nafath or Yakeen endpoints. Explains the approval path, the integration model, and which behaviors you cannot ship without a credential.
- **pdpl-basics** (compliance · region saudi-arabia, v0.3.0) — Engineering-level guardrails for Saudi Arabia's Personal Data Protection Law — consent, retention, minimization, and data export patterns your agent can actually enforce in code.
- **secrets-baseline** (security, v1.1.0) — Keep secrets out of the repository and the commit history. Stack-agnostic rules on env file hygiene, manager integration, and rotating committed secrets.
- **testability-check** (architecture, v0.5.0) — Keep generated code writable-to-test. Clean seams, isolated side effects, no hidden singletons — so the test suite remains a first-class artifact as the codebase grows.
- **zatca-phase2** (compliance · region saudi-arabia, v0.2.0) — Engineering guardrails for ZATCA Phase 2 invoicing — XML structure, signing flow, and onboarding steps an AI agent should respect before it writes code.

## License

MIT
