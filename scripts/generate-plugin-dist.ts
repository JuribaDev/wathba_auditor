// Plugin dist generator.
//
// Reads the canonical skill library via `apps/web/lib/skills/generated.ts`
// (which is itself generated from `skills/<category>/<slug>/` by
// `scripts/generate-skills.ts`) and emits the Claude Code plugin distribution
// under `plugins/wathba-skills/`, plus the marketplace catalog at
// `.claude-plugin/marketplace.json`.
//
// Output is deterministic: files are emitted in sorted order, JSON is stably
// stringified. A companion drift check (`check-plugin-dist-drift.ts`) fails CI
// if generated output diverges from committed state.

import { promises as fs } from "node:fs";
import path from "node:path";

import { generatedSkills } from "../apps/web/lib/skills/generated";
import type { GeneratedSkill } from "../apps/web/lib/skills/generated";

import {
  findSlugCollisions,
  renderPluginSkill,
  writeEmittedFiles,
  clearGeneratedTree,
  writeGeneratedMarker,
  stableStringify,
  clampDescription,
} from "./lib/plugin-dist";

const REPO_ROOT = process.cwd();
const PLUGIN_DIR = path.join(REPO_ROOT, "plugins/wathba-skills");
const MARKETPLACE_FILE = path.join(
  REPO_ROOT,
  ".claude-plugin/marketplace.json",
);

// Identity constants — replace before public release.
// The repo URL also drives the recommended marketplace install command
// (`/plugin marketplace add <owner>/<repo>`), so keep `REPO_URL` pointed at
// the canonical GitHub mirror at all times.
const MARKETPLACE_NAME = "wathba";
const PLUGIN_NAME = "wathba-skills";
const PLUGIN_VERSION = "0.1.0";
const REPO_URL = "https://github.com/wathba-dev/wathba_auditor";
// Homepage intentionally points at the GitHub repo: the wathba.dev domain is
// not yet resolvable, so using it breaks plugin metadata and install guides.
const HOMEPAGE = REPO_URL;
const OWNER_NAME = "Wathba";
const LICENSE = "MIT";

// Derive the `owner/repo` shorthand used in `/plugin marketplace add`.
// Claude Code accepts the full URL too, but the short form is what we show
// users, so we keep one source of truth.
const MARKETPLACE_SHORTHAND = REPO_URL.replace(
  /^https:\/\/github\.com\//,
  "",
).replace(/\.git$/, "");

const PLUGIN_DESCRIPTION =
  "Production-grade Saudi compliance, security, and architecture skills for agent-assisted engineering (ZATCA Phase 2, PDPL, Nafath/Yakeen, mada/STC Pay, auth isolation, secrets baseline, testability, CI hygiene).";

const PLUGIN_KEYWORDS = [
  "saudi",
  "compliance",
  "zatca",
  "pdpl",
  "nafath",
  "security",
  "architecture",
  "wathba",
];

// Plugin-level commands. Wrap real Wathba workflows; not lifecycle filler.
const COMMANDS: Record<string, string> = {
  "wathba-compliance-review.md": `---
description: Audit Saudi-market code for ZATCA Phase 2, PDPL, Nafath/Yakeen, and mada/STC Pay compliance using Wathba's compliance skills.
argument-hint: [path-or-file]
---

Perform a compliance audit for Saudi-market regulations using the Wathba
compliance skills (zatca-phase2, pdpl-basics, nafath-yakeen-basics,
mada-stcpay-basics).

Focus on:
- E-invoicing shape (UUID, cryptographic stamp, QR, simplified vs standard flow)
- Personal-data handling, consent, data-residency, subject-rights endpoints
- National-ID / authentication integration boundaries
- Local-rail payment integration correctness

For each finding, cite the governing source attached in the relevant skill's
\`sources\` block. Separate legal questions (out of scope) from engineering
findings (in scope). Produce a ranked punch list with file paths and line
numbers. Treat the output as engineering guidance, not legal advice.

Target: \${ARGUMENTS:-the current working tree}
`,
  "wathba-security-baseline.md": `---
description: Run Wathba's security-baseline audit — auth isolation and secrets hygiene — across the current code.
argument-hint: [path-or-file]
---

Run a security baseline audit using the Wathba security skills
(auth-isolation, secrets-baseline).

Check for:
- Authentication boundaries (session store, token handling, refresh flows)
- Authorization gates on every mutating endpoint
- Secret surfaces: env files, build outputs, client bundles, logs, error
  responses, backup artifacts
- Rotation and revocation paths

Produce a concrete findings list with file:line citations, severity, and the
exact remediation from the relevant skill's checklist.

Target: \${ARGUMENTS:-the current working tree}
`,
  "wathba-architecture-audit.md": `---
description: Audit architecture for testability and CI hygiene using Wathba's architecture skills.
argument-hint: [path-or-file]
---

Run an architecture audit using the Wathba architecture skills
(testability-check, ci-hygiene).

Evaluate:
- Module seams, dependency direction, side-effect locations
- Test pyramid balance; integration-test boundaries; mocked vs real IO
- CI pipeline structure: cache correctness, parallelization safety, flaky
  guards, artifact provenance

Propose concrete, minimal refactors with effort estimates. Cite each
recommendation to the skill's authoritative reference file.

Target: \${ARGUMENTS:-the current working tree}
`,
  "wathba-install-guide.md": `---
description: Walk a teammate through installing Wathba skills across Claude Code, Cursor, and Codex.
---

Guide the user through installing Wathba skills on their machine. Pick the
right path based on their environment:

1. **Claude Code (recommended)** — via this very plugin:
   \`\`\`
   /plugin marketplace add ${MARKETPLACE_SHORTHAND}
   /plugin install ${PLUGIN_NAME}@${MARKETPLACE_NAME}
   \`\`\`
   Local development: \`/plugin marketplace add ./path/to/wathba_auditor\`.

2. **Cursor** — from a manual export zip built by the Wathba web app, copy
   both the \`.cursor/rules/*.mdc\` files AND the \`.cursor/skills/<slug>/\`
   directories into their repo root. Each surface is independent — rules
   provide durable context, Agent Skills provide interop — and both should
   ship together.

3. **Codex** — copy the \`.agents/skills/<slug>/\` directories into their repo
   root; Codex auto-discovers them.

4. **Manual / offline** — run \`pnpm dev\` in a clone of this repo, answer the
   questionnaire, pick target agents, and download the zip. Or clone and run
   \`pnpm generate:plugin-dist\` for the full plugin tree.

Confirm which target they use, walk through the exact steps, then verify
the install:

- **Claude Code** — \`/plugin\` shows \`wathba-skills\` under installed
  marketplaces, and typing \`/wathba-\` autocompletes the five commands.
- **Cursor** — confirm \`.cursor/rules/<slug>.mdc\` and
  \`.cursor/skills/<slug>/SKILL.md\` exist on disk, reload the window, and
  have Cursor summarise one of the skills to prove it's in context.
- **Codex** — confirm \`.agents/skills/<slug>/SKILL.md\` files exist on
  disk (\`ls .agents/skills\`), then start a Codex session and ask it to
  name the Wathba skills it can see. Do not invoke a \`codex skills list\`
  subcommand — that CLI flag does not exist.

Then answer follow-up questions.
`,
  "wathba-skill-list.md": `---
description: List every installed Wathba skill with category, region, version, and review status.
---

Print a compact table of all installed Wathba skills:

| Slug | Category | Region | Version | Status | Last verified |

Read from the installed plugin directory (\`\${CLAUDE_PLUGIN_ROOT}/skills/\`).
For each skill, parse the \`SKILL.md\` frontmatter and governance footer to
pull version, status, and \`Last verified\` date. Flag any skill whose
\`Last verified\` is older than 180 days.
`,
};

// Plugin-level docs, written into the plugin's docs/ directory.
const PLUGIN_DOCS: Record<string, string> = {
  "installation.md": `# Install the Wathba Skills plugin

## Claude Code marketplace (recommended)

\`\`\`
/plugin marketplace add ${MARKETPLACE_SHORTHAND}
/plugin install ${PLUGIN_NAME}@${MARKETPLACE_NAME}
\`\`\`

Your Claude Code session gains the \`/wathba-compliance-review\`,
\`/wathba-security-baseline\`, \`/wathba-architecture-audit\`,
\`/wathba-install-guide\`, and \`/wathba-skill-list\` commands, plus all
eight Wathba skills as model-invocable context.

## Claude Code local plugin development

Clone the repo and point the marketplace at it:

\`\`\`
git clone ${REPO_URL}.git
cd wathba_auditor
pnpm install
pnpm generate:plugin-dist
/plugin marketplace add ./
/plugin install ${PLUGIN_NAME}@${MARKETPLACE_NAME}
\`\`\`

Edits under \`skills/<category>/<slug>/\` require re-running
\`pnpm generate:plugin-dist\` and \`/plugin marketplace update ${MARKETPLACE_NAME}\`.

## Other agents

Run the web preview (\`pnpm dev\`), pick target agents in the questionnaire,
and download the resulting zip. The zip content reflects the targets you
selected:

- **Cursor** selected → \`.cursor/rules/<slug>.mdc\` (durable context) and
  \`.cursor/skills/<slug>/\` (Agent Skills interop).
- **Codex** selected → \`.agents/skills/<slug>/\`, native.
- **Generic AGENTS.md** selected → \`AGENTS.md\` at the repo root.
`,
  "development.md": `# Plugin development

This plugin is generated from the canonical skill library at
\`skills/<category>/<slug>/\` in the same repo. **Do not hand-edit** files
under \`plugins/wathba-skills/\`; changes will be overwritten by the next
\`pnpm generate:plugin-dist\` run.

## Workflow

1. Edit or add a canonical skill under \`skills/<category>/<slug>/\`.
2. \`pnpm generate:skills\` — rebuilds the typed data layer.
3. \`pnpm generate:plugin-dist\` — rebuilds this plugin tree and
   \`.claude-plugin/marketplace.json\`.
4. \`pnpm verify:plugin-dist\` — drift check.
5. Commit both the canonical changes and the regenerated plugin tree.

## Commands

Commands live in \`scripts/generate-plugin-dist.ts\` as inline templates (see
the \`COMMANDS\` record). Add new commands there; they are wrapped around
real Wathba workflows, not generic lifecycle filler.

## Contracts

See the header comment of \`scripts/lib/plugin-dist.ts\` for the verified
Claude plugin contract this generator targets.
`,
  "skills-overview.md": `# Skills catalog

Eight skills across three categories. Source-of-truth authoring lives at
\`skills/<category>/<slug>/\`; this plugin flattens them to \`skills/<slug>/\`.

- **architecture** — \`ci-hygiene\`, \`testability-check\`
- **security** — \`auth-isolation\`, \`secrets-baseline\`
- **saudi** (region: SA) — \`mada-stcpay-basics\`, \`nafath-yakeen-basics\`,
  \`pdpl-basics\`, \`zatca-phase2\`

Each skill is model-invocable. Every Saudi skill declares its authoritative
sources (ZATCA, SAMA, NDMO, Nafath/Yakeen) in the SKILL.md footer and carries
an engineering-guidance-not-legal-advice disclaimer.
`,
};

async function main() {
  const skills = [...generatedSkills].sort((a, b) => a.slug.localeCompare(b.slug));

  // Fail fast: slugs must be globally unique across categories and regions.
  const collisions = findSlugCollisions(skills);
  if (collisions.length > 0) {
    console.error(
      "[plugin-dist] slug collisions detected — the Claude plugin flattens skills to skills/<slug>/, so slugs must be globally unique:",
    );
    for (const c of collisions) {
      console.error(`  - ${c.slug}: ${c.skillIds.join(", ")}`);
    }
    process.exit(1);
  }

  await clearGeneratedTree(PLUGIN_DIR);
  await fs.mkdir(PLUGIN_DIR, { recursive: true });
  await writeGeneratedMarker(PLUGIN_DIR);

  await writePluginManifest(skills);
  await writeSkillFiles(skills);
  await writeCommands();
  await writeDocs();
  await writePluginReadme(skills);
  await writeMarketplaceManifest();

  console.log(
    `[plugin-dist] generated ${skills.length} skills, ${Object.keys(COMMANDS).length} commands → plugins/wathba-skills/`,
  );
  console.log(`[plugin-dist] wrote marketplace catalog → .claude-plugin/marketplace.json`);
}

async function writePluginManifest(skills: readonly GeneratedSkill[]) {
  // `category` and `strict` belong to the *marketplace entry*, not the plugin
  // manifest. Keeping them here triggers "field ignored" warnings from
  // `claude plugin validate`.
  const manifest = {
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    description: clampDescription(PLUGIN_DESCRIPTION),
    author: { name: OWNER_NAME },
    homepage: HOMEPAGE,
    repository: REPO_URL,
    license: LICENSE,
    keywords: PLUGIN_KEYWORDS,
    skills: ["./skills/"],
    commands: ["./commands/"],
  };
  const dir = path.join(PLUGIN_DIR, ".claude-plugin");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "plugin.json"),
    stableStringify(manifest),
    "utf8",
  );
  console.log(
    `[plugin-dist] wrote plugin.json (${skills.length} skills registered via ./skills/)`,
  );
}

async function writeSkillFiles(skills: readonly GeneratedSkill[]) {
  for (const skill of skills) {
    const files = renderPluginSkill(skill);
    await writeEmittedFiles(PLUGIN_DIR, files);
  }
}

async function writeCommands() {
  const dir = path.join(PLUGIN_DIR, "commands");
  await fs.mkdir(dir, { recursive: true });
  const names = Object.keys(COMMANDS).sort();
  for (const name of names) {
    await fs.writeFile(path.join(dir, name), COMMANDS[name], "utf8");
  }
}

async function writeDocs() {
  const dir = path.join(PLUGIN_DIR, "docs");
  await fs.mkdir(dir, { recursive: true });
  const names = Object.keys(PLUGIN_DOCS).sort();
  for (const name of names) {
    await fs.writeFile(path.join(dir, name), PLUGIN_DOCS[name], "utf8");
  }
}

async function writePluginReadme(skills: readonly GeneratedSkill[]) {
  const skillLines = skills.map((s) => {
    const region = s.region ? ` · region ${s.region}` : "";
    return `- **${s.slug}** (${s.category}${region}, v${s.version}) — ${s.summary?.en ?? s.name.en}`;
  });
  const readme = `# wathba-skills

${PLUGIN_DESCRIPTION}

This directory is **generated** from \`skills/<category>/<slug>/\` in the
parent repo. Do not hand-edit — see \`docs/development.md\`.

## Install

\`\`\`
/plugin marketplace add wathba-dev/wathba_auditor
/plugin install wathba-skills@wathba
\`\`\`

See \`docs/installation.md\` for local-development install and non-Claude
targets (Cursor, Codex, offline).

## Commands

${Object.keys(COMMANDS)
  .sort()
  .map((n) => `- \`/${n.replace(/\.md$/, "")}\``)
  .join("\n")}

## Skills (${skills.length})

${skillLines.join("\n")}

## License

${LICENSE}
`;
  await fs.writeFile(path.join(PLUGIN_DIR, "README.md"), readme, "utf8");
}

async function writeMarketplaceManifest() {
  const manifest = {
    name: MARKETPLACE_NAME,
    owner: { name: OWNER_NAME },
    metadata: {
      description:
        "Wathba marketplace — Saudi compliance, security, and architecture skills for agent-assisted engineering.",
      version: PLUGIN_VERSION,
      pluginRoot: "./plugins",
    },
    plugins: [
      {
        name: PLUGIN_NAME,
        source: "./wathba-skills",
        description: clampDescription(PLUGIN_DESCRIPTION),
        version: PLUGIN_VERSION,
        author: { name: OWNER_NAME },
        homepage: HOMEPAGE,
        repository: REPO_URL,
        license: LICENSE,
        keywords: PLUGIN_KEYWORDS,
        // `category` and `strict` are marketplace-entry-only fields. Keep them
        // here so the plugin manifest doesn't double-declare them.
        category: "compliance",
      },
    ],
  };
  await fs.mkdir(path.dirname(MARKETPLACE_FILE), { recursive: true });
  await fs.writeFile(MARKETPLACE_FILE, stableStringify(manifest), "utf8");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
