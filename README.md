# Wathba Skills

Wathba Skills is an open-source, frontend-only generator for downloadable AI-agent skill packs. It is designed for developers building for Saudi Arabia and the wider MENA region who need better compliance, security, and architecture guidance without introducing a backend.

## What is in this repository?

- `apps/web`: the static Next.js frontend.
- `skills/`: the canonical skill library that contributors can extend without touching the app.
- `packages/skill-schema`: the shared schema used to validate skills.
- `scripts/generate-skills.ts`: the build-time loader that validates `skills/**/skill.yaml` and emits typed data for the frontend.

## Current scope

The repository now matches the early execution path in the project plan:

- `pnpm` workspace with `apps/` and `packages/`
- Static-exportable Next.js app in `apps/web`
- English and Arabic locale routes with RTL handling for Arabic
- Canonical skill schema
- Seed ZATCA Phase 2 skill under `skills/saudi/zatca-phase2`
- Build-time skill generation into the frontend
- Skill browsing pages for `/[locale]/skills` and `/[locale]/skills/[id]`

## Development

```bash
pnpm install
pnpm dev
```

Useful commands:

- `pnpm generate:skills`
- `pnpm lint`
- `pnpm doctor:react`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify`
- `pnpm verify:full`

Git hooks:

- `pnpm install` runs `prepare`, which installs the committed Husky hooks.
- `.husky/pre-commit` runs `pnpm verify` before every commit.
- `pnpm verify:full` adds the Playwright E2E pass on top of the pre-commit checks.

## الموجز العربي

هذا المشروع مولد مفتوح المصدر لحزم مهارات يمكن تنزيلها واستخدامها مع وكلاء البرمجة بالذكاء الاصطناعي. الواجهة أمامية فقط، وتدعم الإنجليزية والعربية، وتركز على الامتثال والأمن وجودة البنية للمشاريع الموجهة للسوق السعودي ومناطق الشرق الأوسط وشمال أفريقيا.
