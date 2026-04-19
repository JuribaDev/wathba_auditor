<!--
Thank you for contributing to Wathba Skills. Please fill out the relevant
sections. If this PR only touches the skill library, you can skip the
application-only checks. If this PR only touches the app, you can skip the
skill-authoring checks.
-->

## Summary

<!-- What does this PR change and why? -->

## Area(s) touched

- [ ] Skill content (`skills/`)
- [ ] Canonical schema (`packages/skill-schema/`)
- [ ] Generator / build scripts (`scripts/`)
- [ ] Web application (`apps/web/`)
- [ ] Governance / docs (README, CONTRIBUTING, DISCLAIMER, CODEOWNERS, .github/)

## Checks

- [ ] `pnpm verify:skills` passes locally (version policy + freshness + drift)
- [ ] `pnpm verify` passes locally (full pipeline)

## Skill changes only

- [ ] Version bumps match the classes of change (see CONTRIBUTING → "Skill versioning policy"). Patch for body/metadata, minor for additive changes (variable/target/reference added), major for identity or breaking changes (id/slug, removed/renamed variable, removed target).
- [ ] `apps/web/lib/skills/generated.ts` regenerated and committed if any `skills/` file changed.

## Compliance skills only

- [ ] `disclaimer: true` is set in `skill.yaml`
- [ ] At least one authoritative source is cited
- [ ] `last_verified` is within the last 180 days
- [ ] Every `sources[*].accessed` date is within the last 180 days
- [ ] Bilingual labels (English + Arabic) are complete

## Schema or generator changes only

- [ ] Tests added or updated to cover the new behavior
- [ ] No existing skill silently broke (run `pnpm verify:skills:freshness -- --all` as a sanity check if the change might affect validation)

## Notes for reviewers

<!-- Anything the reviewer should know: tricky parts, open questions, follow-ups. -->

---

## باللغة العربية (اختياري)

<!-- اذكر باختصار ما الذي تغير ولماذا. تأكد من تشغيل `pnpm verify` قبل طلب المراجعة. -->
