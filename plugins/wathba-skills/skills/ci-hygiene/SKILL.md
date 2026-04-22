---
name: ci-hygiene
description: "If the repo has no CI the agent adds one. If it does the agent keeps it honest — lint, typecheck, tests, and migration hygiene as rules the agent can actually enforce."
---

# CI Hygiene

## When this skill activates

Use this skill whenever the work touches the build pipeline, test runners, dependency installation, deploy workflows, or any change that can pass locally but break CI for the team.

## Baseline rules

1. CI runs the same checks a reviewer expects locally — linting, typechecking, tests, and build. None of them are optional.
2. Skipping a failing test to land a change is a regression, not a merge strategy.
3. Flaky tests are fixed or quarantined explicitly. Silent retries are not a fix.
4. Migrations run in CI against a disposable database before they run against production.

## If the repository has no CI

Add a minimal pipeline that runs on every pull request:

1. Install dependencies deterministically using the project's lockfile.
2. Run the linter, the typechecker, and the test suite in sequence.
3. Build the production artifact.
4. Fail the job on any non-zero exit.

Do not skip a step because "the repo doesn't have one yet" — add it in the same change.

## If the repository has CI

- Confirm the agent's change does not disable a check to make the build green.
- Confirm new behavior has a corresponding test running under the existing matrix.
- Confirm the build is reproducible — no `latest` tags, no unpinned actions, no mystery caches.

## Migration hygiene

- Schema migrations and data migrations are separate. Do not hide a data rewrite inside a schema migration.
- Every migration has a tested rollback plan, even if the plan is "restore from backup" with a documented threshold.
- Long-running migrations run out-of-band, not during the deploy window.

## Dependency hygiene

- Lockfiles are committed and enforced. CI installs from the lockfile, not the manifest.
- Security-sensitive dependency bumps land in their own change, not bundled with a feature.
- Do not add a dependency without naming the single responsibility it takes on in the code.

## References

- Run `scripts/ci-smoke.mjs` locally before pushing a change that modifies the pipeline or the build configuration.

_Version: 0.5.0 · Last verified: 2026-03-22 · Status: maintainer-reviewed_

**Sources**

- [The Twelve-Factor App](https://12factor.net/)
