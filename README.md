# Wathba Skills

Wathba Skills is an open-source, frontend-only generator for downloadable AI-agent skill packs. It is designed for developers building for Saudi Arabia and the wider MENA region who need better compliance, security, and architecture guidance without introducing a backend.

The product works end-to-end in the browser: answer a short bilingual questionnaire, review recommended skills, preview how each skill renders for Claude Code, Cursor, Codex, or a generic `AGENTS.md` consumer, and download a ready-to-drop-in zip. Nothing is sent to a remote service.

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
- Skill library (`/[locale]/skills`), detail (`/[locale]/skills/[id]`), generate flow, and compare canvas

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
- `pnpm verify` — one-shot pipeline of everything above (runs on pre-commit)
- `pnpm verify:full` — adds the Playwright E2E pass

Git hooks:

- `pnpm install` runs `prepare`, which installs the committed Husky hooks.
- `.husky/pre-commit` runs `pnpm verify` before every commit.

## Contributing a skill

The skill library is the durable product value. It is intentionally decoupled from the web app so content contributors never need to touch React or routing.

Add or update a skill:

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
