# Wathba Skills

Wathba Skills is an open-source, frontend-only generator for downloadable AI-agent skill packs. It is designed for developers building for Saudi Arabia and the wider MENA region who need better compliance, security, and architecture guidance without introducing a backend.

The product works end-to-end in the browser: answer a short bilingual questionnaire, review recommended skills, preview how each skill renders as a native Agent Skills package for Claude Code, Cursor, Codex, or a generic `AGENTS.md` consumer, and download a ready-to-drop-in zip. Nothing is sent to a remote service.

## Export contract

Every exported skill is a real Agent Skills package ([spec](https://agentskills.io/specification)): a directory containing `SKILL.md` with open-standard frontmatter (`name`, `description`) plus any supporting files the author bundled. Output paths per target:

| Target | Root path | Entry point |
| --- | --- | --- |
| Claude Code | `.claude/skills/<slug>/` | `.claude/skills/<slug>/SKILL.md` |
| Cursor | `.cursor/skills/<slug>/` | `.cursor/skills/<slug>/SKILL.md` |
| OpenAI Codex | `.agents/skills/<slug>/` | `.agents/skills/<slug>/SKILL.md` |
| Generic fallback | repo root | `AGENTS.md` |

- The three native targets emit a complete skill directory — `SKILL.md` plus every `references/`, `scripts/`, `assets/`, `agents/openai.yaml`, or other author-bundled file, preserved under the skill root.
- `AGENTS.md` is only produced by the generic adapter. It is **not** how Codex or Cursor skills are installed; those use `.agents/skills/` and `.cursor/skills/` respectively.
- Exported `SKILL.md` frontmatter is docs-native. Wathba governance (version, status, last-verified, disclaimer, sources) is rendered into the markdown body, not into undocumented frontmatter fields.
- Binary support files (images, templated XML/PDF assets, etc.) round-trip losslessly through the zip. The "Install via AI" prompt flow replaces them with a placeholder and tells the user to use the downloaded zip for those files.

- Home: [https://github.com/juriba/wathba-skills](https://github.com/juriba/wathba-skills)
- License: [MIT](./LICENSE)
- Disclaimer: [DISCLAIMER.md](./DISCLAIMER.md) — engineering guidance only, not legal advice.

## Repository structure

```
apps/web/                 Static Next.js frontend (App Router, React 19, TS)
packages/skill-schema/    Shared zod schema for skills + inferred TS types
skills/                   Canonical skill library (content lives here)
scripts/                  Build-time skill loader and generator
.github/                  CI workflows, issue templates, governance
```

Current scope:

- `pnpm` workspace with `apps/` and `packages/`
- Static-exportable Next.js app in `apps/web`
- English and Arabic locale routes with RTL handling for Arabic
- Canonical skill schema
- Seed Saudi, security, and architecture skills under `skills/`
- Build-time skill generation into the frontend
- Skill library (`/[locale]/skills`), detail (`/[locale]/skills/[id]`), generate flow, and contributor wizard (`/[locale]/skills/contribute`) for add/update/retire/delete

## Local development

```bash
pnpm install
pnpm dev
```

Useful commands:

- `pnpm generate:skills` — validate `skills/**/skill.yaml` and emit typed data
- `pnpm lint`
- `pnpm doctor:react`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:skills` — fast governance gate: version-bump policy + compliance freshness + generated-output drift (runs on pre-commit)
- `pnpm verify` — full pipeline: verify:skills + typecheck + lint + tests + build
- `pnpm verify:full` — adds the Playwright E2E pass

## Skill governance workflow

Every skill change is classified and gated automatically:

```
edit skills/ ──► detect changed skills ──► classify severity ──► enforce SemVer bump
                                                                       │
                                  regenerate catalog ◄─────────────────┘
                                           │
                                           ▼
                                   commit or CI fails
```

- **Version bump policy** — Patch for `SKILL.md` + metadata edits. Minor for additive changes (new variable, new target, new reference). Major for identity or breaking changes (id/slug, removed or renamed variable, removed target). The full matrix lives in [CONTRIBUTING.md](./CONTRIBUTING.md).
- **Detecting changed skills** — `pnpm verify:skills:versions` diffs against `origin/main` (or `$GITHUB_BASE_REF` in CI) and only inspects skills that changed on this branch.
- **Generated-output drift** — `apps/web/lib/skills/generated.ts` is regenerated in CI; if it differs from the committed file, the build fails with a diff excerpt and a precise fix command. Never hand-edit that file.
- **Compliance freshness** — Only *changed* compliance skills are checked. Thresholds: `last_verified` ≤ 180 days, every `sources[*].accessed` ≤ 180 days. Overridable via `WATHBA_LAST_VERIFIED_MAX_DAYS` / `WATHBA_SOURCE_ACCESSED_MAX_DAYS`. Run `pnpm verify:skills:freshness -- --all` to audit every compliance skill before a release.

Git hooks:

- `pnpm install` runs `prepare`, which installs the committed Husky hooks.
- `.husky/pre-commit` runs `pnpm verify` before every commit.

## Contributing a skill

The skill library is the durable product value. It is intentionally decoupled from the web app so content contributors never need to touch React or routing.

Two authoring paths are supported:

**In-browser contributor wizard** — `/[locale]/skills/contribute` ships with the site. The `Add new skill` CTA on the skills library and the `Update skill / Retire skill / Delete skill` CTAs on each detail page open a wizard that collects the required fields and estimates the SemVer bump your change will require. The last step emits a repo-aware prompt for Claude Code, Cursor, Codex, or any generic coding agent. The agent edits `skills/**`, runs `pnpm generate:skills`, and runs `pnpm verify:skills` on your behalf. See the `Contribute via AI` panel.

**Hand-authored** — add or update the skill directly:

1. Create a folder under `skills/<category-or-region>/<slug>/`. Valid top-level categories today: `saudi`, `security`, `architecture`.
2. Add `skill.yaml` with canonical metadata (id, category, status, version, `last_verified`, localized labels, variables, references, scripts, sources).
3. Add `SKILL.md` with the rendered body. Use variable placeholders declared in the schema when the skill needs per-project input.
4. Optional: add a `references/` folder for background material and a `scripts/` folder for helper scripts targets like Claude Code can expose.
5. Compliance-oriented skills (anything under `skills/saudi/` or any skill marked as touching regulated behavior) must:
   - set the `disclaimer` flag in `skill.yaml`,
   - cite at least one authoritative source, and
   - keep `last_verified` current.
6. Run `pnpm generate:skills` to validate and regenerate the frontend data.
7. Run `pnpm verify` to make sure lint, typecheck, tests, and build all stay green.

Never hand-edit `apps/web/lib/skills/generated.ts` — it is emitted by the generator.

### Skill lifecycle

Every skill carries two orthogonal states:

- `status` — editorial review quality (`maintainer-reviewed`, `community-maintained`, `draft`).
- `lifecycle` — discoverability (`active`, `deprecated`, `archived`). Defaults to `active`.

Lifecycle rules:

- **Retire** — switch to `lifecycle: deprecated` (and optionally `replacement_id`, `sunset_date`, `lifecycle_note`) when a skill is still usable but a newer skill supersedes it. Deprecated skills stay visible in the library with a visible banner and are deprioritized.
- **Archive** — switch to `lifecycle: archived` when the skill should no longer surface in default discovery. Archived skills are hidden from the default library view and excluded from recommendation flows; they remain available behind the explicit Archived filter.
- **Reactivate** — flip a `deprecated` or `archived` skill back to `active` through the `Update skill` contributor action. Lifecycle transitions are classified as `minor` bumps.
- **Delete** — the `Delete skill` contributor action is an advanced maintenance path that removes the skill package entirely. It is a `major` governance event. Prefer **retire + archive** unless the skill was never released or has no downstream consumers.
- **Replacement chains** — a deprecated skill may point at its successor via `replacement_id`. The loader validates that every replacement target exists; self-references are rejected. For full identity migrations (`id` and `slug` both changing) keep using the existing `previous_id` list on the new skill — that still enforces the major-bump requirement.

Bilingual contribution guidance (English + Arabic) lives in [CONTRIBUTING.md](./CONTRIBUTING.md). Maintainer routing for Saudi compliance, security, architecture, schema, web, and generator changes lives in [CODEOWNERS](./CODEOWNERS).

## Reporting issues

Use the issue templates under `.github/ISSUE_TEMPLATE/`:

- Bug report (English)
- Feature request (English and Arabic)

## License

Wathba Skills is released under the MIT license. See [LICENSE](./LICENSE) for the full text.

## الموجز العربي

هذا المشروع مولد مفتوح المصدر لحزم مهارات يمكن تنزيلها واستخدامها مع وكلاء البرمجة بالذكاء الاصطناعي. الواجهة أمامية فقط، وتدعم الإنجليزية والعربية، وتركز على الامتثال والأمن وجودة البنية للمشاريع الموجهة للسوق السعودي ومناطق الشرق الأوسط وشمال أفريقيا.

- المساهمة: راجع [CONTRIBUTING.md](./CONTRIBUTING.md) لقواعد المساهمة باللغتين الإنجليزية والعربية.
- إخلاء المسؤولية: راجع [DISCLAIMER.md](./DISCLAIMER.md). يقدم المشروع إرشادات هندسية فقط ولا يعد استشارة قانونية.
- الترخيص: [MIT](./LICENSE).
