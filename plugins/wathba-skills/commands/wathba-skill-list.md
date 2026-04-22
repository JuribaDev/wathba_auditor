---
description: List every installed Wathba skill with category, region, version, and review status.
---

Print a compact table of all installed Wathba skills:

| Slug | Category | Region | Version | Status | Last verified |

Read from the installed plugin directory (`${CLAUDE_PLUGIN_ROOT}/skills/`).
For each skill, parse the `SKILL.md` frontmatter and governance footer to
pull version, status, and `Last verified` date. Flag any skill whose
`Last verified` is older than 180 days.
