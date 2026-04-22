# Skills catalog

Eight skills across three categories. Source-of-truth authoring lives at
`skills/<category>/<slug>/`; this plugin flattens them to `skills/<slug>/`.

- **architecture** — `ci-hygiene`, `testability-check`
- **security** — `auth-isolation`, `secrets-baseline`
- **saudi** (region: SA) — `mada-stcpay-basics`, `nafath-yakeen-basics`,
  `pdpl-basics`, `zatca-phase2`

Each skill is model-invocable. Every Saudi skill declares its authoritative
sources (ZATCA, SAMA, NDMO, Nafath/Yakeen) in the SKILL.md footer and carries
an engineering-guidance-not-legal-advice disclaimer.
