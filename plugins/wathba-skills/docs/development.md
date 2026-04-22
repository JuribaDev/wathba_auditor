# Plugin development

This plugin is generated from the canonical skill library at
`skills/<category>/<slug>/` in the same repo. **Do not hand-edit** files
under `plugins/wathba-skills/`; changes will be overwritten by the next
`pnpm generate:plugin-dist` run.

## Workflow

1. Edit or add a canonical skill under `skills/<category>/<slug>/`.
2. `pnpm generate:skills` — rebuilds the typed data layer.
3. `pnpm generate:plugin-dist` — rebuilds this plugin tree and
   `.claude-plugin/marketplace.json`.
4. `pnpm verify:plugin-dist` — drift check.
5. Commit both the canonical changes and the regenerated plugin tree.

## Commands

Commands live in `scripts/generate-plugin-dist.ts` as inline templates (see
the `COMMANDS` record). Add new commands there; they are wrapped around
real Wathba workflows, not generic lifecycle filler.

## Contracts

See the header comment of `scripts/lib/plugin-dist.ts` for the verified
Claude plugin contract this generator targets.
