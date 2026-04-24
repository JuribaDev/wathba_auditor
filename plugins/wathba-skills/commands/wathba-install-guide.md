---
description: Walk a teammate through installing Wathba skills across Claude Code, Cursor, and Codex.
---

Guide the user through installing Wathba skills on their machine. Pick the
right path based on their environment:

1. **Claude Code (recommended)** — via this very plugin:
   ```
   /plugin marketplace add JuribaDev/wathba_auditor
   /plugin install wathba-skills@wathba
   ```
   Local development: `/plugin marketplace add ./path/to/wathba_auditor`.

2. **Cursor** — from a manual export zip built by the Wathba web app, copy
   both the `.cursor/rules/*.mdc` files AND the `.cursor/skills/<slug>/`
   directories into their repo root. Each surface is independent — rules
   provide durable context, Agent Skills provide interop — and both should
   ship together.

3. **Codex** — copy the `.agents/skills/<slug>/` directories into their repo
   root; Codex auto-discovers them.

4. **Manual / offline** — run `pnpm dev` in a clone of this repo, answer the
   questionnaire, pick target agents, and download the zip. Or clone and run
   `pnpm generate:plugin-dist` for the full plugin tree.

Confirm which target they use, walk through the exact steps, then verify
the install:

- **Claude Code** — `/plugin` shows `wathba-skills` under installed
  marketplaces, and typing `/wathba-` autocompletes the five commands.
- **Cursor** — confirm `.cursor/rules/<slug>.mdc` and
  `.cursor/skills/<slug>/SKILL.md` exist on disk, reload the window, and
  have Cursor summarise one of the skills to prove it's in context.
- **Codex** — confirm `.agents/skills/<slug>/SKILL.md` files exist on
  disk (`ls .agents/skills`), then start a Codex session and ask it to
  name the Wathba skills it can see. Do not invoke a `codex skills list`
  subcommand — that CLI flag does not exist.

Then answer follow-up questions.
