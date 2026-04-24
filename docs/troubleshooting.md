# Troubleshooting

Use this page when the website, generated files, or install paths do not behave as expected.

## The Generated Zip Is Empty

Check that:

- At least one skill is selected on the review step.
- At least one target agent is selected on the tech step.
- Required variables are filled.

The generate step disables download when required values are missing.

## The Agent Does Not See Installed Skills

Check the target path:

| Agent | Expected path |
| --- | --- |
| Claude Code | `.claude/skills/<slug>/SKILL.md` |
| Cursor | `.cursor/skills/<slug>/SKILL.md` and `.cursor/rules/<slug>.mdc` |
| Codex | `.agents/skills/<slug>/SKILL.md` |
| Generic | `AGENTS.md` |

Then restart or reload the agent. Some agents discover skills only at session start.

## Claude Code Marketplace Install Fails

Run:

```text
/plugin marketplace add wathba-dev/wathba_auditor
/plugin marketplace update wathba
/plugin install wathba-skills@wathba
```

If installing from a local clone, regenerate the plugin dist first:

```bash
pnpm install
pnpm generate:plugin-dist
```

Then in Claude Code:

```text
/plugin marketplace add ./
/plugin install wathba-skills@wathba
```

## Cursor Does Not Pick Up Rules

Cursor may need a window reload after files are added.

Confirm both surfaces exist:

```text
.cursor/rules/<slug>.mdc
.cursor/skills/<slug>/SKILL.md
```

The rules provide durable project context. The skills directory provides Agent Skills interop.

## Codex Does Not Pick Up Skills

Confirm files are under:

```text
.agents/skills/<slug>/SKILL.md
```

Start a new Codex session after adding files.

## Arabic Direction Looks Wrong

Arabic routes should render with:

```text
lang="ar"
dir="rtl"
```

English routes should render with:

```text
lang="en"
dir="ltr"
```

If route direction is wrong, treat it as a site bug.

## Contribution Prompt Is Too Large

Use the zip/manual route when:

- The prompt exceeds your agent context.
- The selected skills include binary support files.
- Your agent has unreliable clipboard handling.

The zip and prompt are generated from the same selected skills.

## A Skill Contribution Fails Verification

Run the specific skill checks:

```bash
pnpm generate:skills
pnpm verify:skills
```

Common causes:

- `skill.yaml` does not match the schema.
- `slug` does not match the folder name.
- Required SemVer bump was skipped.
- Compliance skill has stale `last_verified` or source `accessed` dates.
- Compliance skill does not set `disclaimer: true`.
- A deprecated skill points to a missing `replacement_id`.

## Local E2E Port Is Busy

The Playwright config supports `PW_PORT`.

```bash
PW_PORT=3001 pnpm --filter @agent-skills/web test:e2e
```

Use `PW_REUSE_SERVER=1` only when you intentionally want Playwright to reuse an already-running static server.

## Full Release Verification

Before publishing the website or plugin, run:

```bash
pnpm verify
PW_PORT=3001 pnpm --filter @agent-skills/web test:e2e
pnpm audit --audit-level moderate
claude plugin validate .
claude plugin validate plugins/wathba-skills
```

All commands should pass before release.
