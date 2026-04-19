# Contributing

## English

Thank you for contributing. This project separates the web application from the skill library on purpose:

- If you are adding or improving a skill, work inside `skills/`.
- If you are changing validation rules, update `packages/skill-schema`.
- If you are changing the UI or generation flow, work inside `apps/web`.

Before opening a pull request:

1. Run `pnpm generate:skills`.
2. Run `pnpm lint`.
3. Run `pnpm typecheck`.
4. Run `pnpm test`.
5. Keep compliance disclaimers intact for regional skills.

Skill authoring rules:

- Every skill must include `skill.yaml` and `SKILL.md`.
- `skill.yaml` must validate against the canonical schema.
- Do not hand-edit `apps/web/lib/skills/generated.ts`; it is generated.
- Compliance skills must keep sources and `last_verified` fresh.

## المساهمة

شكراً لمساهمتك. تم فصل تطبيق الويب عن مكتبة المهارات عمداً:

- إذا كنت تضيف مهارة أو تطورها فاعمل داخل `skills/`.
- إذا كنت تعدل قواعد التحقق فاعمل داخل `packages/skill-schema`.
- إذا كنت تغير الواجهة أو مسار التوليد فاعمل داخل `apps/web`.

قبل فتح طلب دمج:

1. شغّل `pnpm generate:skills`.
2. شغّل `pnpm lint`.
3. شغّل `pnpm typecheck`.
4. شغّل `pnpm test`.
5. لا تحذف إخلاءات المسؤولية من مهارات الامتثال.

