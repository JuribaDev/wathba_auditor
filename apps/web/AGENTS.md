<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

- This app keeps the root layout under `app/[locale]/layout.tsx` so static export can emit the correct `lang` and `dir` attributes per locale.
- Skill data comes from `skills/**/skill.yaml` via `pnpm generate:skills`. Do not hand-edit `lib/skills/generated.ts`.
