# Contributing

## English

Thank you for contributing. This project separates the web application from the skill library on purpose:

- If you are adding or improving a skill, work inside `skills/`.
- If you are changing validation rules, update `packages/skill-schema`.
- If you are changing the UI or generation flow, work inside `apps/web`.

### Local workflow

Before opening a pull request:

1. `pnpm install` (once per checkout).
2. Make your changes. If you touched `skills/`, re-run `pnpm generate:skills`.
3. `pnpm verify:skills` — runs the governance gate (version bump + compliance freshness + generated-output drift). This also runs automatically on `git commit` via husky.
4. `pnpm verify` — full pipeline locally (typecheck, lint, tests, build).

Helpful subcommands:

| Command | What it does |
| --- | --- |
| `pnpm verify:skills:versions` | Classify diff vs. base and fail if the required version bump was skipped. |
| `pnpm verify:skills:freshness` | Check only *changed* compliance skills for stale `last_verified` / source access dates. |
| `pnpm verify:skills:drift` | Regenerate `apps/web/lib/skills/generated.ts` and fail if it wasn't committed. |
| `pnpm verify:skills:freshness -- --all` | Scan every compliance skill (useful before a release audit). |

### Contributor workflow (structured wizard)

An in-browser contributor wizard ships at `/[locale]/skills/contribute`. It is a frontend-only helper: nothing is written to disk by the site — the wizard emits a repo-aware prompt that you paste into your coding agent (Claude Code, Cursor, Codex, or a generic `AGENTS.md` consumer), and the agent performs the edits, runs `pnpm generate:skills`, and runs `pnpm verify:skills` for you.

Entry points:

- `Add new skill` CTA on `/[locale]/skills` — authors a brand-new skill.
- `Update skill` / `Retire skill` / `Delete skill` CTAs on `/[locale]/skills/[id]` — edit an existing skill's metadata, change its lifecycle, or hard-delete the package.
- Direct URL: `/[locale]/skills/contribute?action=add|update|retire|delete[&id=<skill-id>]`.

The wizard walks through five steps: **Action → Metadata → Content → Governance → AI handoff**. On the Governance step it estimates the SemVer bump your change will trigger before you hand off to the agent, so there are no surprises at `pnpm verify:skills:versions` time.

### `status` vs. `lifecycle`

Every skill carries two orthogonal axes:

| Axis | Values | Purpose |
| --- | --- | --- |
| `status` | `maintainer-reviewed`, `community-maintained`, `draft` | Editorial review quality. |
| `lifecycle` | `active`, `deprecated`, `archived` | Discoverability. Defaults to `active`. |

A skill can legitimately be `maintainer-reviewed` and `deprecated` at the same time — the editorial bar is still high, but the content has been superseded.

### Retire vs. hard-delete

| Situation | Action | Governance impact |
| --- | --- | --- |
| Newer skill supersedes this one | Set `lifecycle: deprecated`, add `replacement_id`, optionally `sunset_date` and a `lifecycle_note` | Minor bump |
| The skill should disappear from default discovery but remain referenceable | Set `lifecycle: archived` | Minor bump |
| The skill was accidentally added, never released, or has no downstream consumers | Hard-delete the `skills/<group>/<slug>/` directory | Major bump |

Always prefer `retire + archive` over hard-delete. A hard delete breaks any `replacement_id` chain that points at the deleted skill — the loader rejects unresolved references. Retire the pointing skill first, or pick a different successor, before deleting.

### Replacement chains and identity migrations

- `replacement_id` on a deprecated/archived skill points readers at its successor. The loader refuses to start if that id does not resolve, and rejects self-references (`replacement_id == id`).
- `previous_id` on a new skill announces that this skill is a rewritten form of one or more predecessor ids. This is for cases where `id` AND `slug` both change and the body is substantially rewritten in a single PR — governance pairs old-and-new by that list. See *Declaring identity migrations* below.
- Chain recommendation: if skill `A` is superseded by `B`, which is later superseded by `C`, update `A.replacement_id` to `C` so readers jump directly to the current successor rather than chasing pointers.

### Skill versioning policy

Every skill carries a SemVer `version`. The required bump is derived automatically by `pnpm verify:skills:versions`. If multiple change classes apply, the strictest wins.

**Patch bump (`x.y.Z`) required for:**
- `SKILL.md` body edits
- Changes to `summary`, `name`, `maintainers`, `status`, `disclaimer`, `sources`, source `accessed` dates, or `last_verified`
- Non-breaking edits to reference or script file *content*
- Lifecycle metadata edits that do not change the lifecycle state itself: `sunset_date`, `lifecycle_note`

**Minor bump (`x.Y.0`) required for:**
- Adding a variable
- Adding a target
- Adding a reference or script file (backward-compatible)
- Adding a trigger
- Lifecycle state transitions (`active → deprecated`, `deprecated → archived`, `deprecated → active` reactivation, and so on)
- Changing `replacement_id`

**Major bump (`X.0.0`) required for:**
- Changing `id` or `slug`
- Changing `category` (compliance gating changes)
- Removing a target
- Removing, renaming, or retyping a variable
- Removing or narrowing variable options
- Hard-deleting the skill package

### Declaring identity migrations

When a PR both `id` and `slug` change (and the `SKILL.md` body is substantially rewritten in the same commit), governance cannot structurally distinguish the rename from a genuine delete+add. Declare the migration explicitly by adding a `previous_id` list to the new skill's `skill.yaml`:

```yaml
id: ksa-pdpl-basics-v2
slug: pdpl-basics-v2
previous_id:
  - saudi-pdpl-basics
version: 1.0.0
```

`verify:skills:versions` then pairs the new skill with the named old skill, enforces the major-bump requirement, and removes the "unresolved migration" failure. If a PR contains a new skill and a removed skill that are **not** a rename, split them into separate PRs.

### Generated output contract

`apps/web/lib/skills/generated.ts` is produced by `pnpm generate:skills`. You MUST commit any regenerated output that your changes produced. CI fails if `apps/web/lib/skills/generated.ts` is stale — with a diff excerpt and a precise fix command. Never hand-edit it.

### Compliance freshness

Compliance skills (category: `compliance`) must stay current. `pnpm verify:skills:freshness` only inspects skills whose files changed in the current branch, so untouched legacy skills never fail unrelated PRs. Thresholds (override via env if needed):

| Field | Max age | Env override |
| --- | --- | --- |
| `last_verified` | 180 days | `WATHBA_LAST_VERIFIED_MAX_DAYS` |
| Every `sources[*].accessed` | 180 days | `WATHBA_SOURCE_ACCESSED_MAX_DAYS` |

Compliance skills must also keep `disclaimer: true` and cite at least one authoritative source.

### When to split a pull request

Split into separate PRs when:
- You are changing `packages/skill-schema` *and* adding/editing skills in the same branch — ship the schema change first so reviewers can see it isolated from content edits.
- You are modifying the generator (`scripts/generate-skills.ts`) *and* touching skills — the generator change has a larger blast radius and deserves its own review.
- You are editing more than five unrelated skills — a reviewer can more easily sign off on one compliance area at a time.

Keep together:
- All files for a single skill (`skill.yaml` + `SKILL.md` + references/scripts) in the same PR as the version bump that announces them.

### Reviewer expectations

Reviewers should verify:
- **Skill-only PR**: read the SKILL.md diff, confirm the version bump matches the classifier output in CI, and spot-check any referenced `sources`.
- **Schema or generator PR**: ensure tests cover the behavior change; require green `pnpm verify` locally; check that no skills regressed.
- **Multi-skill PR**: each skill's required bump is applied independently — do not accept a single global bump that masks varied change classes.

### Skill authoring rules (inherited)

- Every skill must include `skill.yaml` and `SKILL.md`.
- `skill.yaml` must validate against the canonical schema.
- Do not hand-edit `apps/web/lib/skills/generated.ts`; it is generated.
- Compliance skills must keep sources and `last_verified` fresh.

### Canonical vs. exported formats

A skill in this repo has two views:

1. **Authoring (canonical).** Lives under `skills/<group>/<slug>/` and is the source of truth. `skill.yaml` holds Wathba governance metadata (id, version, status, last_verified, sources, disclaimer, variables, maintainers). `SKILL.md` holds the markdown body. The loader recursively collects every other file in the directory and preserves the relative path — so `references/foo.md`, `scripts/bar.sh`, `assets/diagrams/arch.md`, and an optional Codex-specific `agents/openai.yaml` all ship as-is.

2. **Exported (native Agent Skills packages).** The adapters in `apps/web/lib/generate/adapters/` turn the canonical skill into real native packages for each target:
   - Claude Code → `.claude/skills/<slug>/`
   - Cursor → `.cursor/skills/<slug>/`
   - OpenAI Codex → `.agents/skills/<slug>/`
   - Generic fallback → `AGENTS.md` (only this adapter is allowed to produce that file)

   Exported `SKILL.md` files use docs-native frontmatter (`name`, `description`). Governance data that the open standard does not reserve (version, status, last_verified, disclaimer, sources) is written into the markdown body as a footer — never smuggled into undocumented frontmatter fields.

### Authoring support files

- Drop files into any subdirectory of the skill folder. `references/`, `scripts/`, `assets/`, `templates/`, `agents/` and nested folders are all supported and exported verbatim under the skill root.
- Files are captured as-is. Text files are stored in the generated catalog as UTF-8; binary files (e.g. `assets/logo.png`) are stored base64-encoded and round-trip losslessly through the zip export. The "Install via AI" text prompt flow replaces binary files with a placeholder and points the user at the downloaded zip.
- Junk files (`.DS_Store`, `Thumbs.db`, macOS `._*` resource forks, editor swap files) are ignored automatically. Symbolic links are rejected to prevent packaging content from outside the skill directory.
- Every skill folder must keep `skill.yaml` and `SKILL.md` at the root. The leaf folder name must match the `slug`. Everything else is treated as a support file and preserved relative to the skill root.

## المساهمة

شكراً لمساهمتك. تم فصل تطبيق الويب عن مكتبة المهارات عمداً:

- إذا كنت تضيف مهارة أو تطورها فاعمل داخل `skills/`.
- إذا كنت تعدل قواعد التحقق فاعمل داخل `packages/skill-schema`.
- إذا كنت تغير الواجهة أو مسار التوليد فاعمل داخل `apps/web`.

### سير العمل المحلي

قبل فتح طلب دمج:

1. شغّل `pnpm install` مرة واحدة بعد الاستنساخ.
2. إن كنت عدّلت محتوى `skills/` فأعد توليد الكتالوج بـ `pnpm generate:skills`.
3. شغّل `pnpm verify:skills` — يتحقق من سياسة ترقية الإصدار، وتحديث مهارات الامتثال، وحداثة الكتالوج المولّد. يعمل تلقائياً عند إنشاء commit.
4. شغّل `pnpm verify` — المسار الكامل محلياً (typecheck / lint / tests / build).

### معالج المساهمة

تم شحن معالج مساهمة داخل المتصفح على المسار `/[locale]/skills/contribute`. المعالج لا يعدّل القرص؛ بل يُنتج تعليمات جاهزة تلصقها في وكيل البرمجة الخاص بك (Claude Code أو Cursor أو Codex أو أي وكيل يقرأ المستودع). بعدها يُطبّق الوكيل التعديلات ويشغّل `pnpm generate:skills` و`pnpm verify:skills` بالنيابة عنك.

نقاط الدخول:

- زر `إضافة مهارة جديدة` في مكتبة المهارات.
- أزرار `تحديث / تقاعد / حذف` في صفحة تفاصيل المهارة.
- المعلمات المباشرة: `?action=add|update|retire|delete[&id=<skill-id>]`.

يمرّ المعالج بخمس خطوات: **الإجراء → البيانات الوصفية → المحتوى → الحوكمة → تسليم الذكاء الاصطناعي**. تقدّر خطوة الحوكمة ترقية الإصدار قبل التسليم لتكون على علم بالأثر المتوقع.

### `status` مقابل `lifecycle`

- `status` = جودة المراجعة التحريرية (`maintainer-reviewed`، `community-maintained`، `draft`).
- `lifecycle` = قابلية الاكتشاف (`active`، `deprecated`، `archived`). الافتراضي `active`.

يمكن أن تكون المهارة `maintainer-reviewed` و`deprecated` في الوقت ذاته.

### متى تُقاعَد ومتى تُحذَف

| الحالة | الإجراء | الأثر |
| --- | --- | --- |
| مهارة أحدث تحلّ محلّها | `lifecycle: deprecated` مع `replacement_id` و`lifecycle_note` | Minor |
| إخفاء المهارة من الاكتشاف الافتراضي | `lifecycle: archived` | Minor |
| أُضيفت خطأً أو لم تُنشَر ولا مستهلكين لها | حذف مجلد `skills/<group>/<slug>/` بالكامل | Major |

يُفضَّل دائماً التقاعد مع الأرشفة بدل الحذف النهائي. الحذف النهائي يكسر أي سلسلة `replacement_id` تشير إلى المهارة المحذوفة — المحمّل يرفض أي إشارة غير مُعرَّفة.

### سياسة ترقية الإصدار

كل مهارة تحمل حقل `version` بصيغة SemVer. يُحسب الحد الأدنى للترقية تلقائياً عبر `pnpm verify:skills:versions`. إن اجتمعت عدة أنواع من التغييرات فالأشدّ هو المطلوب.

- **Patch**: تعديل `SKILL.md`، أو `summary`، `name`، `maintainers`، `status`، `disclaimer`، `sources`، تاريخ `accessed` لأي مصدر، أو `last_verified`، أو تعديل محتوى ملف مرجعي/سكربت موجود، أو تعديل `sunset_date` أو `lifecycle_note` دون تغيير حالة `lifecycle` نفسها.
- **Minor**: إضافة متغيّر، أو إضافة هدف (target)، أو إضافة ملف مرجعي/سكربت جديد، أو إضافة trigger، أو انتقال `lifecycle` (تقاعد/أرشفة/إعادة تفعيل)، أو تغيير `replacement_id`.
- **Major**: تغيير `id` أو `slug`، تغيير `category`، إزالة هدف، إزالة أو إعادة تسمية أو تغيير نوع متغيّر، إزالة خيار من متغيّر من نوع `select`، أو الحذف النهائي لحزمة المهارة.

### تحديث الكتالوج المولّد

ملف `apps/web/lib/skills/generated.ts` يُنتج آلياً من `pnpm generate:skills`. يجب الالتزام (commit) بكل تغيير يُحدثه التوليد. CI يفشل إن كان الملف قديماً، مع إظهار الفرق وأمر الإصلاح الدقيق.

### حداثة مهارات الامتثال

تحقق من حداثة مهارات الامتثال المعدّلة فقط عبر `pnpm verify:skills:freshness` — لن يفشل طلب الدمج بسبب مهارة قديمة لم تُلمس. الحدود الافتراضية: 180 يوماً لكلٍّ من `last_verified` و`sources[*].accessed`، وتقبل تجاوزها بمتغيرات البيئة `WATHBA_LAST_VERIFIED_MAX_DAYS` و`WATHBA_SOURCE_ACCESSED_MAX_DAYS`.

### متى تفصل طلبات الدمج

- عند تعديل `packages/skill-schema` مع إضافة/تعديل مهارات: اشحن تغيير الـschema أولاً.
- عند تعديل المولد مع مهارات: المولد له أثر أوسع فيستحق مراجعة مستقلة.
- عند تعديل أكثر من خمس مهارات غير مترابطة: افصل حسب المجال.
