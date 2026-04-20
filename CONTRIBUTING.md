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

### Skill versioning policy

Every skill carries a SemVer `version`. The required bump is derived automatically by `pnpm verify:skills:versions`. If multiple change classes apply, the strictest wins.

**Patch bump (`x.y.Z`) required for:**
- `SKILL.md` body edits
- Changes to `summary`, `name`, `maintainers`, `status`, `disclaimer`, `sources`, source `accessed` dates, or `last_verified`
- Non-breaking edits to reference or script file *content*

**Minor bump (`x.Y.0`) required for:**
- Adding a variable
- Adding a target
- Adding a reference or script file (backward-compatible)
- Adding a trigger

**Major bump (`X.0.0`) required for:**
- Changing `id` or `slug`
- Changing `category` (compliance gating changes)
- Removing a target
- Removing, renaming, or retyping a variable
- Removing or narrowing variable options

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

### سياسة ترقية الإصدار

كل مهارة تحمل حقل `version` بصيغة SemVer. يُحسب الحد الأدنى للترقية تلقائياً عبر `pnpm verify:skills:versions`. إن اجتمعت عدة أنواع من التغييرات فالأشدّ هو المطلوب.

- **Patch**: تعديل `SKILL.md`، أو `summary`، `name`، `maintainers`، `status`، `disclaimer`، `sources`، تاريخ `accessed` لأي مصدر، أو `last_verified`، أو تعديل محتوى ملف مرجعي/سكربت موجود.
- **Minor**: إضافة متغيّر، أو إضافة هدف (target)، أو إضافة ملف مرجعي/سكربت جديد، أو إضافة trigger.
- **Major**: تغيير `id` أو `slug`، تغيير `category`، إزالة هدف، إزالة أو إعادة تسمية أو تغيير نوع متغيّر، إزالة خيار من متغيّر من نوع `select`.

### تحديث الكتالوج المولّد

ملف `apps/web/lib/skills/generated.ts` يُنتج آلياً من `pnpm generate:skills`. يجب الالتزام (commit) بكل تغيير يُحدثه التوليد. CI يفشل إن كان الملف قديماً، مع إظهار الفرق وأمر الإصلاح الدقيق.

### حداثة مهارات الامتثال

تحقق من حداثة مهارات الامتثال المعدّلة فقط عبر `pnpm verify:skills:freshness` — لن يفشل طلب الدمج بسبب مهارة قديمة لم تُلمس. الحدود الافتراضية: 180 يوماً لكلٍّ من `last_verified` و`sources[*].accessed`، وتقبل تجاوزها بمتغيرات البيئة `WATHBA_LAST_VERIFIED_MAX_DAYS` و`WATHBA_SOURCE_ACCESSED_MAX_DAYS`.

### متى تفصل طلبات الدمج

- عند تعديل `packages/skill-schema` مع إضافة/تعديل مهارات: اشحن تغيير الـschema أولاً.
- عند تعديل المولد مع مهارات: المولد له أثر أوسع فيستحق مراجعة مستقلة.
- عند تعديل أكثر من خمس مهارات غير مترابطة: افصل حسب المجال.
