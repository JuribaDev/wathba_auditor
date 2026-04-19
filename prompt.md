# Ralph Agent Instructions

You are an autonomous coding agent working on **Wathba Skills**.

## Project Context

- **Type**: frontend-only, static-export web app
- **Workspace**: `pnpm` monorepo
- **Web app**: `apps/web` using Next.js App Router, React 19, TypeScript, and static export
- **Skill library**: `skills/` contains the canonical skill content
- **Shared schema**: `packages/skill-schema`
- **Skill generation**: `scripts/generate-skills.ts` validates `skills/**/skill.yaml` and emits generated frontend data
- **Locales**: English and Arabic, with RTL support for Arabic
- **System design source**: `wathba auditor/` is the source of truth for UI, interaction patterns, bilingual parity, and visual direction

Keep these constraints intact:

- No backend, no database, no runtime API routes
- Static export must continue to work
- English and Arabic must stay in parity
- The durable product value is the skill library, not app-specific glue code
- For frontend or UI work, use the `frontend-design` skill and follow the system design in `wathba auditor/`

## Your Task

1. Read `ralph/prd.json`
2. Read `ralph/progress.txt`
3. Check you are on the branch from `prd.json.branchName`; create or switch if needed
4. Pick the **highest-priority** user story where `passes: false`
5. Implement **only that one story**
6. Run the required checks
7. If checks pass, update `ralph/prd.json` and set that story's `passes` to `true`
8. Append a short progress entry to `ralph/progress.txt`
9. Commit all changes with message: `feat(<scope>): [Story ID] - [Story Title]`

## Required Checks

Run these from the repo root unless the story explicitly needs something narrower:

```bash
pnpm verify
```

Run this as well when the story touches the end-to-end generation flow or explicitly requires browser-level verification:

```bash
pnpm verify:full
```

`pnpm verify` currently covers:

- skill generation
- React/ESLint verification
- schema typecheck
- app typecheck
- unit tests
- production build

Do not commit broken code.

## Implementation Rules

- Work on **one story per iteration**
- Keep changes focused on the selected story
- Follow the existing workspace structure and naming
- Do not hand-edit generated outputs if they are produced by a script
- If you change skill metadata or content shape, regenerate skills before finishing
- Preserve static export compatibility
- Preserve EN/AR behavior and RTL correctness
- For any frontend-facing change, match the visual and interaction direction already defined in `wathba auditor/`

## Commit Convention

Use conventional commits with a scope that matches the work:

```text
feat(web): [US-021] - Add skill library filters
feat(skills): [US-015] - Seed initial skill catalog
feat(schema): [US-012] - Define canonical skill schema
fix(generator): [US-036] - Resolve skill variables before rendering
docs(repo): [US-050] - Add contributor governance docs
```

## Progress Format

Append to `ralph/progress.txt`:

```text
## [Date/Time] - [Story ID]
- Implemented:
- Files changed:
- Checks run:
- Notes for future work:
---
```

Keep it short but useful. Only include reusable context or real gotchas.

## Stop Condition

After finishing one story, check whether all stories in `ralph/prd.json` now have `passes: true`.

If all stories are complete, reply with:

```text
<promise>COMPLETE</promise>
```

Otherwise, end normally.

## Important

- Do not start a second story in the same iteration
- Keep the repo shippable after every commit
- If a story conflicts with the current architecture, choose the simplest solution that fits the PRD and existing codebase
