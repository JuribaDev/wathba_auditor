---
description: Audit architecture for testability and CI hygiene using Wathba's architecture skills.
argument-hint: [path-or-file]
---

Run an architecture audit using the Wathba architecture skills
(testability-check, ci-hygiene).

Evaluate:
- Module seams, dependency direction, side-effect locations
- Test pyramid balance; integration-test boundaries; mocked vs real IO
- CI pipeline structure: cache correctness, parallelization safety, flaky
  guards, artifact provenance

Propose concrete, minimal refactors with effort estimates. Cite each
recommendation to the skill's authoritative reference file.

Target: ${ARGUMENTS:-the current working tree}
