# Ralph Agent Instructions

You are an autonomous coding agent working on a Flutter monorepo (Munawala — a delivery marketplace with customer and traveller apps).

## Project Context

- **Monorepo**: Melos + Dart pub workspaces. Apps in `apps/`, shared packages in `packages/`.
- **Flutter**: 3.41.0 (pinned via `.fvmrc`). Always use `fvm flutter` or melos scripts.
- **Architecture**: Clean Architecture with BLoC. Each feature: `domain/` → `data/` → `presentation/` → `di/`.
- **DI**: GetIt (`sl = GetIt.instance`). Each feature has `<Feature>Locator.init()`.
- **Networking**: gRPC. Proto files in `apps/<app>/protos/`, generated stubs in `lib/src/core/grpc/generated/`.
- **L10n**: ARB files in `apps/<app>/lib/l10n/arb/`. Default locale: Arabic.
- **State**: BLoC with `copyWith` pattern. Use `clearX` booleans for nullable field resets.
- **Use cases**: Extend `BaseUseCase<T, Parameters>`, return `FutureEither<T>` (`Future<Either<Failure, T>>`).

Read `CLAUDE.md` at the repo root for full architecture details.

## Your Task

1. Read the PRD at `ralph/prd.json` (in the same directory as this file)
2. Read the progress log at `ralph/progress.txt` (check Codebase Patterns section first)
3. Read `CLAUDE.md` at the repo root for architecture and conventions
4. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
5. Pick the **highest priority** user story where `passes: false`
6. Implement that single user story
7. Run quality checks (see below)
8. If checks pass, commit ALL changes with message: `feat(<scope>): [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `ralph/progress.txt`

## Quality Checks (Required Before Every Commit)

Run these from the affected app directory (e.g., `apps/customer`):

```bash
# 1. Static analysis
cd apps/<app> && fvm flutter analyze

# 2. Formatting (line length 120)
cd apps/<app> && fvm dart format --line-length 120 --set-exit-if-changed lib

# 3. Tests (run targeted tests for changed features)
cd apps/<app> && fvm flutter test test/src/features/<feature>/

# 4. If proto files changed, regenerate
melos run generate:customer:grpc   # or generate:traveller:grpc

# 5. If ARB files changed, regenerate l10n
cd apps/<app> && fvm flutter gen-l10n
```

- ALL commits must pass analyze and format checks
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns in the codebase

## Design & UI

When implementing any UI (pages, widgets, screens), use `/frontend-design` to generate high-quality, production-grade frontend code. This ensures distinctive, polished interfaces that avoid generic AI aesthetics.

## Feature Implementation Checklist

When implementing a new feature or modifying existing ones:

1. **Domain layer first**: entities, params, repository interface, use case
2. **Data layer**: model (extending/mapping entity), data source (gRPC calls), repository implementation
3. **Presentation layer**: BLoC (events, state, bloc), pages, widgets
4. **DI**: Register all new classes in the feature's `<Feature>Locator.init()`. Use `registerFactory` for BLoCs, `registerLazySingleton` for repos/data sources/use cases.
5. **Exports**: Add new files to `features_exports.dart` or `core_exports.dart`
6. **L10n**: Add user-facing strings to both `app_en.arb` and `app_ar.arb`, then run `fvm flutter gen-l10n`
7. **Tests**: Add tests under `test/src/features/<feature>/` mirroring the production tree. Use `bloc_test` + `mocktail`.

## Commit Convention

Use conventional commits scoped to the affected module:

```
feat(auth): [STORY-1] - Add OTP verification bloc
fix(order): [STORY-2] - Handle null status in tracking
refactor(grpc): [STORY-3] - Extract error parsing to shared package
```

## Progress Report Format

APPEND to ralph/progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- App affected: customer | traveller | both | packages
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---
```

Include enough context so future iterations can understand what was done. Memory persists via git history and ralph/progress.txt.

The learnings section is critical - it helps future iterations avoid repeating mistakes and understand the codebase better.

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of ralph/progress.txt (create it if it doesn't exist). This section should consolidate the most important learnings:

```
## Codebase Patterns
- BLoC states use `copyWith` with `clearX` booleans for nullable fields
- All use cases return `FutureEither<T>` via dartz Either
- Feature locators are called in order in ServicesLocator.init() — respect dependency order
- gRPC clients are registered in GrpcLocator, not feature locators
- ARB keys must exist in both app_en.arb and app_ar.arb or gen-l10n fails
```

Only add patterns that are **general and reusable**, not story-specific details.

## Update AGENTS.md Files

Before committing, check if any edited files have learnings worth preserving in nearby AGENTS.md files:

1. **Identify directories with edited files** - Look at which directories you modified
2. **Check for existing AGENTS.md** - Look for AGENTS.md in those directories or parent directories (e.g., `apps/customer/AGENTS.md`)
3. **Add valuable learnings** - If you discovered something future developers/agents should know:
    - API patterns or conventions specific to that module
    - Gotchas or non-obvious requirements
    - Dependencies between files or locator init order
    - Testing approaches for that area

**Examples of good AGENTS.md additions:**
- "When modifying X, also update Y to keep them in sync"
- "This module uses pattern Z for all API calls"
- "Tests require the dev server running on PORT 3000"
- "Field names must match the template exactly"

**Do NOT add:**
- Story-specific implementation details
- Temporary debugging notes
- Information already in ralph/progress.txt

Only update AGENTS.md if you have **genuinely reusable knowledge** that would help future work in that directory.

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green — `fvm flutter analyze` and `fvm dart format --line-length 120` must pass
- Read the Codebase Patterns section in ralph/progress.txt before starting
- Use relative imports within an app, path dependencies for shared packages
- Never edit generated files (`*.g.dart`, `*.pb.dart`, `*.pbenum.dart`, `*.pbgrpc.dart`, `*.pbjson.dart`, `app_localizations*.dart`) by hand — use the generation scripts
