# Wathba Skills

Wathba Skills is an open-source library of production-grade agent skills for developers building for Saudi Arabia and the wider MENA region. Canonical authoring lives under `skills/<category>/<slug>/`; the library is distributed as a Claude Code plugin (via a marketplace and a local-plugin flow), as native Cursor and Codex artefacts, and as a manual zip for offline/generic use.

- Canonical source of truth: `skills/<category>/<slug>/`
- Claude Code plugin: `plugins/wathba-skills/` (**generated**, do not hand-edit)
- Claude Code marketplace catalog: `.claude-plugin/marketplace.json` (**generated**)
- Web preview + manual zip builder: `apps/web/`
- License: [MIT](./LICENSE) · Disclaimer: [DISCLAIMER.md](./DISCLAIMER.md) (engineering guidance only — not legal advice)

## Install

### 1. Claude Code Marketplace (recommended)

In any Claude Code session:

```
/plugin marketplace add wathba-dev/wathba_auditor
/plugin install wathba-skills@wathba
```

You get:

- **Eight model-invocable skills** — `zatca-phase2`, `pdpl-basics`, `nafath-yakeen-basics`, `mada-stcpay-basics`, `auth-isolation`, `secrets-baseline`, `testability-check`, `ci-hygiene`.
- **Five slash commands** wired to real Wathba workflows — `/wathba-compliance-review`, `/wathba-security-baseline`, `/wathba-architecture-audit`, `/wathba-install-guide`, `/wathba-skill-list`.

Update to the latest catalog at any time with `/plugin marketplace update wathba`.

### 2. Claude Code Local Plugin

For contributors, air-gapped environments, or branch previews:

```bash
git clone https://github.com/wathba-dev/wathba_auditor.git
cd wathba_auditor
pnpm install
pnpm generate:plugin-dist
```

Then inside Claude Code:

```
/plugin marketplace add ./
/plugin install wathba-skills@wathba
```

Re-run `pnpm generate:plugin-dist` after canonical edits; refresh Claude Code with `/plugin marketplace update wathba`.

### 3. Cursor

Cursor ships with two compatible surfaces — `.cursor/rules/*.mdc` (durable context) and `.cursor/skills/<slug>/SKILL.md` (Agent Skills interop). Use the web app to download a zip that contains both:

1. Open the Wathba web preview (`pnpm dev`, or the hosted site).
2. Run the questionnaire, pick the skills you want, open the **Cursor** card.
3. Use **Advanced → Download zip** at the bottom and extract into your repo root.

### 4. Codex

Native — drop `.agents/skills/<slug>/` directories into your repo root from the same zip. Codex auto-discovers them on next session start.

### 5. Manual zip / offline

The zip ships exactly the targets you selected in the questionnaire — Claude Code, Cursor (both `.cursor/rules/` and `.cursor/skills/`), Codex (`.agents/skills/`), and/or a generic `AGENTS.md`. If you want every target in one archive, select them all before downloading.

> The web app's **Install via AI** prompt-copy path is preserved as an advanced fallback for teams using a coding agent other than Claude Code / Cursor / Codex.

## Export contract

| Target | Root path | Entry point |
| --- | --- | --- |
| Claude Code plugin (installed via marketplace) | `plugins/wathba-skills/skills/<slug>/` | `SKILL.md` |
| Claude Code (manual zip) | `.claude/skills/<slug>/` | `SKILL.md` |
| Cursor rules (durable context) | `.cursor/rules/` | `<slug>.mdc` |
| Cursor Agent Skills (interop) | `.cursor/skills/<slug>/` | `SKILL.md` |
| Codex | `.agents/skills/<slug>/` | `SKILL.md` |
| Generic fallback | repo root | `AGENTS.md` |

Every exported `SKILL.md` carries docs-native frontmatter (`name`, `description`) per the Agent Skills spec. Wathba governance (version, status, `Last verified`, disclaimer, sources) is rendered into the markdown body or footer — never into undocumented frontmatter fields.

Binary support files round-trip losslessly through the zip and the plugin dist; the Install-via-AI prompt path replaces them with placeholders and instructs the user to use the zip for those files.

## Repository structure

```
.claude-plugin/            Generated: marketplace.json (Claude Code catalog)
plugins/wathba-skills/     Generated: Claude Code plugin (skills/, commands/, docs/, plugin.json)
apps/web/                  Static Next.js app (preview, questionnaire, manual zip builder)
packages/skill-schema/     Shared Zod schema + inferred TS types
skills/                    CANONICAL skill library — authoritative source
scripts/                   Generators: skills data, plugin dist, drift checks
.github/                   CI workflows, issue templates, governance
```

## Local development

```bash
pnpm install
pnpm dev                # web preview at http://localhost:3000
```

Generators and verification:

- `pnpm generate:skills` — validate `skills/**/skill.yaml` and emit `apps/web/lib/skills/generated.ts`.
- `pnpm generate:plugin-dist` — regenerate `plugins/wathba-skills/` and `.claude-plugin/marketplace.json` from the canonical library. Deterministic; commit the output.
- `pnpm verify:skills` — SemVer bump policy + compliance freshness + generated-data drift.
- `pnpm verify:plugin-dist` — regenerate the plugin dist and fail if it differs from committed state.
- `pnpm verify` — full pipeline: `verify:skills` + `verify:plugin-dist` + doctor:react + typecheck + lint + tests + build.
- `pnpm verify:full` — adds the Playwright E2E pass.

> **Never hand-edit files under `plugins/wathba-skills/` or `.claude-plugin/marketplace.json`** — both are regenerated from `skills/<category>/<slug>/`. See [`plugins/wathba-skills/docs/development.md`](./plugins/wathba-skills/docs/development.md).

## Skill governance workflow

```
edit skills/ ──► detect changed skills ──► classify severity ──► enforce SemVer bump
                                                                       │
                                        regenerate catalog ◄───────────┘
                                                │
                              regenerate plugin dist (deterministic)
                                                │
                                                ▼
                                        commit or CI fails
```

- **Version bump policy** — Patch for `SKILL.md`/metadata edits. Minor for additive changes (new variable, new target, new reference). Major for identity or breaking changes. Full matrix in [CONTRIBUTING.md](./CONTRIBUTING.md).
- **Detecting changed skills** — `pnpm verify:skills:versions` diffs against `origin/main` (or `$GITHUB_BASE_REF` in CI).
- **Generated-output drift** — `apps/web/lib/skills/generated.ts` AND `plugins/wathba-skills/**` AND `.claude-plugin/marketplace.json` are regenerated in CI; any divergence fails the build with a diff excerpt and a precise fix command.
- **Compliance freshness** — Only *changed* compliance skills are checked. Thresholds: `last_verified` ≤ 180 days, every `sources[*].accessed` ≤ 180 days.

Git hooks:

- `pnpm install` runs `prepare`, which installs the committed Husky hooks.
- `.husky/pre-commit` runs `pnpm verify` before every commit.

## Contributing a skill

The skill library is the durable product value. It is intentionally decoupled from the web app and the plugin dist so contributors never need to touch React, routing, or the plugin manifest.

Two authoring paths are supported:

**In-browser contributor wizard** — `/[locale]/skills/contribute` ships with the site. The `Add new skill` CTA on the skills library and the `Update skill / Retire skill / Delete skill` CTAs on each detail page open a wizard that collects the required fields and estimates the SemVer bump your change will require.

**Hand-authored** — add or update the skill directly:

1. Create a folder under `skills/<category-or-region>/<slug>/`. Valid top-level categories today: `saudi`, `security`, `architecture`.
2. Add `skill.yaml` with canonical metadata (id, category, status, version, `last_verified`, localized labels, variables, references, scripts, sources).
3. Add `SKILL.md` with the rendered body. Use variable placeholders declared in the schema when the skill needs per-project input.
4. Optional: `references/` for background material, `scripts/` for helpers.
5. Compliance-oriented skills must set the `disclaimer` flag, cite at least one authoritative source, and keep `last_verified` current.
6. Run `pnpm generate:skills` to validate and regenerate the typed data.
7. Run `pnpm generate:plugin-dist` to regenerate the Claude plugin tree and marketplace catalog.
8. Run `pnpm verify` to make sure governance, lint, typecheck, tests, and build all stay green.

Never hand-edit `apps/web/lib/skills/generated.ts`, files under `plugins/wathba-skills/`, or `.claude-plugin/marketplace.json` — they are emitted by the generators.

### Skill lifecycle

Every skill carries two orthogonal states:

- `status` — editorial review quality (`maintainer-reviewed`, `community-maintained`, `draft`).
- `lifecycle` — discoverability (`active`, `deprecated`, `archived`). Defaults to `active`.

Lifecycle rules:

- **Retire** — switch to `lifecycle: deprecated` (and optionally `replacement_id`, `sunset_date`, `lifecycle_note`) when a skill is still usable but superseded. Deprecated skills stay visible with a banner and are deprioritized.
- **Archive** — switch to `lifecycle: archived` when the skill should no longer surface in default discovery. Hidden from the default library view and recommendation flows; remain available behind the explicit Archived filter.
- **Reactivate** — flip a `deprecated` or `archived` skill back to `active` via the `Update skill` contributor action. Classified as a `minor` bump.
- **Delete** — advanced maintenance path that removes the skill package entirely. A `major` governance event. Prefer **retire + archive** unless the skill was never released.
- **Replacement chains** — a deprecated skill may point at its successor via `replacement_id`. The loader validates that every replacement target exists; self-references are rejected.

Bilingual contribution guidance lives in [CONTRIBUTING.md](./CONTRIBUTING.md). Maintainer routing lives in [CODEOWNERS](./CODEOWNERS).

## Reporting issues

Use the issue templates under `.github/ISSUE_TEMPLATE/`:

- Bug report (English)
- Feature request (English and Arabic)

## License

Wathba Skills is released under the MIT license. See [LICENSE](./LICENSE) for the full text.

## الموجز العربي

Wathba Skills مكتبة مفتوحة المصدر من مهارات وكلاء الذكاء الاصطناعي ذات جودة إنتاجية، موجّهة للمطورين في السوق السعودي ومنطقة الشرق الأوسط وشمال أفريقيا. المصدر الرسمي لأي مهارة هو `skills/<category>/<slug>/`؛ وتُوزَّع المكتبة:

- كإضافة Claude Code عبر السوق (المسار المُوصى به):

  ```
  /plugin marketplace add wathba-dev/wathba_auditor
  /plugin install wathba-skills@wathba
  ```

- كإضافة محلية لـ Claude Code للمساهمين والبيئات المعزولة.
- كملفات `.cursor/rules/*.mdc` و `.cursor/skills/` لمستخدمي Cursor.
- كمجلدات `.agents/skills/<slug>/` أصلية لـ Codex.
- كحزمة zip يدوية لأي وكيل آخر أو للاستخدام دون اتصال.

المساهمة: راجع [CONTRIBUTING.md](./CONTRIBUTING.md). إخلاء المسؤولية: راجع [DISCLAIMER.md](./DISCLAIMER.md). الترخيص: [MIT](./LICENSE).
