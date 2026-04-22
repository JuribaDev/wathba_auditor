# Install the Wathba Skills plugin

## Claude Code marketplace (recommended)

```
/plugin marketplace add wathba-dev/wathba_auditor
/plugin install wathba-skills@wathba
```

Your Claude Code session gains the `/wathba-compliance-review`,
`/wathba-security-baseline`, `/wathba-architecture-audit`,
`/wathba-install-guide`, and `/wathba-skill-list` commands, plus all
eight Wathba skills as model-invocable context.

## Claude Code local plugin development

Clone the repo and point the marketplace at it:

```
git clone https://github.com/wathba-dev/wathba_auditor.git
cd wathba_auditor
pnpm install
pnpm generate:plugin-dist
/plugin marketplace add ./
/plugin install wathba-skills@wathba
```

Edits under `skills/<category>/<slug>/` require re-running
`pnpm generate:plugin-dist` and `/plugin marketplace update wathba`.

## Other agents

Run the web preview (`pnpm dev`), pick target agents in the questionnaire,
and download the resulting zip. The zip content reflects the targets you
selected:

- **Cursor** selected → `.cursor/rules/<slug>.mdc` (durable context) and
  `.cursor/skills/<slug>/` (Agent Skills interop).
- **Codex** selected → `.agents/skills/<slug>/`, native.
- **Generic AGENTS.md** selected → `AGENTS.md` at the repo root.
