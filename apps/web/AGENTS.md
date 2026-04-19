<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

- This app keeps the root layout under `app/[locale]/layout.tsx` so static export can emit the correct `lang` and `dir` attributes per locale.
- Skill data comes from `skills/**/skill.yaml` via `pnpm generate:skills`. Do not hand-edit `lib/skills/generated.ts`.
- Design tokens are defined once in `app/globals.css` (semantic layer) and consumed through Tailwind utilities (`bg-surface`, `text-muted-foreground`, `border-border-strong`, `bg-primary-soft`, etc.) or CSS variables (`var(--surface)`). Never hard-code hex values or Tailwind palette classes in components; extend the token layer instead. Source of truth for the warm editorial palette: `wathba auditor/styles.css`.
