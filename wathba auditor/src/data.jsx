// Skill catalog + question catalog
const SKILLS = [
  {
    id: "zatca-phase2",
    slug: "zatca-phase2",
    category: "saudi",
    region: "KSA",
    version: "0.4.2",
    status: "reviewed",
    lastVerified: "2026-03-18",
    disclaimer: true,
    maintainers: ["@huda.a", "@omar.k"],
    name: { en: "ZATCA Phase 2 e-invoicing", ar: "الفوترة الإلكترونية — ZATCA المرحلة الثانية" },
    plain: {
      en: "For products that issue invoices in Saudi Arabia. Tells your agent how to format, sign, and send invoice XML to ZATCA’s Fatoora portal.",
      ar: "للمنتجات التي تُصدر فواتير في السعودية. تُخبر الوكيل كيف ينسّق ويوقّع ويرسل XML الفواتير إلى بوابة فاتورة في هيئة الزكاة.",
    },
    desc: {
      en: "Covers UBL 2.1 invoice shape, QR tags, cryptographic stamp, integration modes, and the clearance vs. reporting split.",
      ar: "تغطّي بنية UBL 2.1، ووسوم QR، والتوقيع التشفيري، وأنماط التكامل، والفرق بين الإقرار والفوترة الفورية.",
    },
    targets: ["claude", "cursor", "codex", "generic"],
    variables: [
      { id: "stack", label: { en: "Your backend stack", ar: "منصّتك" }, kind: "select", options: ["node", "python", "php", "go"] },
      { id: "invoice_volume", label: { en: "Expected monthly invoice volume", ar: "حجم الفواتير الشهري المتوقع" }, kind: "select", options: ["<1k", "1k–50k", "50k+"] },
      { id: "has_pos", label: { en: "Using a point-of-sale device?", ar: "هل تستخدم جهاز نقاط بيع؟" }, kind: "boolean" },
    ],
    references: 3,
    scripts: 1,
    sources: [
      { en: "ZATCA Fatoora e-invoicing portal", ar: "بوابة فاتورة — هيئة الزكاة" },
      { en: "UBL 2.1 KSA implementation guidelines", ar: "إرشادات تنفيذ UBL 2.1 للسعودية" },
    ],
  },
  {
    id: "pdpl-basics",
    slug: "pdpl-basics",
    category: "saudi",
    region: "KSA",
    version: "0.2.0",
    status: "community",
    lastVerified: "2026-02-04",
    disclaimer: true,
    maintainers: ["@layla.s"],
    name: { en: "PDPL basics for engineers", ar: "أساسيات نظام حماية البيانات الشخصية للمهندسين" },
    plain: {
      en: "For products that store user data (names, emails, phones, IDs). Practical engineering rules: consent, retention, minimization, export — without legalese.",
      ar: "للمنتجات التي تخزّن بيانات المستخدمين. قواعد هندسية عملية: الموافقة، الاحتفاظ، التقليل، التصدير — بدون لغة قانونية.",
    },
    desc: {
      en: "Not legal advice. Engineering-level guidance that maps PDPL principles to code-visible practices your agent can enforce.",
      ar: "ليست استشارة قانونية. توجيه هندسي يُسقط مبادئ النظام على ممارسات يمكن للوكيل فرضها في الكود.",
    },
    targets: ["claude", "cursor", "codex", "generic"],
    variables: [],
    references: 1,
    scripts: 0,
    sources: [{ en: "SDAIA PDPL regulation text", ar: "نص نظام حماية البيانات — سدايا" }],
  },
  {
    id: "nafath-yakeen-basics",
    slug: "nafath-yakeen-basics",
    category: "saudi",
    region: "KSA",
    version: "0.1.1",
    status: "draft",
    lastVerified: "2026-01-22",
    disclaimer: true,
    maintainers: ["@mohammed.t"],
    name: { en: "Nafath & Yakeen identity onboarding", ar: "نفاذ ويقين — التحقق من الهوية" },
    plain: {
      en: "For apps that need to verify a Saudi citizen or resident. Tells the agent upfront: you can’t just call an API — there’s an approval process.",
      ar: "لتطبيقات تتحقق من مواطن أو مقيم سعودي. تُخبر الوكيل مقدّمًا: لا يمكن مجرد استدعاء API — هناك عملية موافقة.",
    },
    desc: {
      en: "Prevents the classic failure mode of an agent inventing fake Nafath endpoints because it couldn’t find real docs.",
      ar: "يمنع النمط الكلاسيكي حيث يخترع الوكيل نقاط نهاية وهمية لنفاذ لعدم عثوره على توثيق فعلي.",
    },
    targets: ["claude", "cursor", "codex", "generic"],
    variables: [],
    references: 2,
    scripts: 0,
    sources: [{ en: "Nafath service catalog", ar: "دليل خدمات نفاذ" }],
  },
  {
    id: "mada-stcpay-basics",
    slug: "mada-stcpay-basics",
    category: "saudi",
    region: "KSA",
    version: "0.2.1",
    status: "community",
    lastVerified: "2026-02-28",
    disclaimer: true,
    maintainers: ["@noor.a"],
    name: { en: "mada & STC Pay payment basics", ar: "أساسيات مدفوعات مدى وSTC Pay" },
    plain: {
      en: "For products accepting Saudi-local payments. Covers the gotchas generic payment tutorials miss — BIN ranges, 3DS quirks, settlement timing.",
      ar: "للمنتجات التي تقبل المدفوعات المحلية. تُغطّي الفخاخ التي تفوتها الأدلة العامة — نطاقات BIN، خصائص 3DS، توقيت التسوية.",
    },
    desc: { en: "Stack-aware notes for the most common integration libraries.", ar: "ملاحظات حسب المنصّة لأكثر مكتبات التكامل شيوعًا." },
    targets: ["claude", "cursor", "codex", "generic"],
    variables: [{ id: "stack", label: { en: "Your backend stack", ar: "منصّتك" }, kind: "select", options: ["node", "python", "php", "go"] }],
    references: 1,
    scripts: 0,
    sources: [{ en: "mada rulebook summary", ar: "ملخّص قواعد مدى" }],
  },
  {
    id: "secrets-baseline",
    slug: "secrets-baseline",
    category: "security",
    region: "global",
    version: "1.0.0",
    status: "reviewed",
    lastVerified: "2026-03-02",
    disclaimer: false,
    maintainers: ["@core"],
    name: { en: "Secrets baseline", ar: "الأساس الآمن للأسرار" },
    plain: {
      en: "Teaches the agent to keep secrets out of the repo and the commit history. Works for every stack.",
      ar: "تُعلّم الوكيل أن يُبقي الأسرار خارج المستودع وخارج سجل الكوميتات. تعمل لكل المنصّات.",
    },
    desc: { en: "Covers env file hygiene, manager integration patterns, and rotating committed secrets.", ar: "تغطّي نظافة ملفات env، وأنماط التكامل مع مدراء الأسرار، وتدوير الأسرار المسرّبة." },
    targets: ["claude", "cursor", "codex", "generic"],
    variables: [{ id: "manager", label: { en: "Preferred secret manager", ar: "مدير الأسرار المفضّل" }, kind: "select", options: ["vault", "doppler", "aws", "infisical", "none"] }],
    references: 0,
    scripts: 1,
    sources: [],
  },
  {
    id: "auth-isolation",
    slug: "auth-isolation",
    category: "security",
    region: "global",
    version: "0.3.0",
    status: "community",
    lastVerified: "2026-02-14",
    disclaimer: false,
    maintainers: ["@core"],
    name: { en: "Auth boundary isolation", ar: "عزل حدود المصادقة" },
    plain: {
      en: "Teaches the agent to separate admin code from user code, and to never mix session contexts. Cuts out a whole class of leaks.",
      ar: "تُعلّم الوكيل أن يفصل كود المشرف عن كود المستخدم، وألّا يخلط سياقات الجلسات. تُزيل صنفًا كاملاً من الثغرات.",
    },
    desc: { en: "Patterns for keeping privileged actions explicit, auditable, and un-bypassable.", ar: "أنماط لإبقاء الإجراءات المميّزة صريحة وقابلة للتدقيق وغير قابلة للتجاوز." },
    targets: ["claude", "cursor", "codex", "generic"],
    variables: [],
    references: 1,
    scripts: 0,
    sources: [],
  },
  {
    id: "testability-check",
    slug: "testability-check",
    category: "architecture",
    region: "global",
    version: "0.4.0",
    status: "community",
    lastVerified: "2026-03-10",
    disclaimer: false,
    maintainers: ["@core"],
    name: { en: "Testability check", ar: "فحص قابلية الاختبار" },
    plain: {
      en: "Teaches the agent to write code that’s easy to test — clean seams, isolated side effects, no hidden singletons.",
      ar: "تُعلّم الوكيل كتابة كود يسهل اختباره — فواصل نظيفة، آثار جانبية معزولة، بدون singletons مخفيّة.",
    },
    desc: { en: "Discipline your agent so tests stay writable as the codebase grows.", ar: "انضباط للوكيل حتى تبقى الاختبارات قابلة للكتابة مع نمو الكود." },
    targets: ["claude", "cursor", "codex", "generic"],
    variables: [],
    references: 0,
    scripts: 0,
    sources: [],
  },
  {
    id: "ci-hygiene",
    slug: "ci-hygiene",
    category: "architecture",
    region: "global",
    version: "0.5.0",
    status: "reviewed",
    lastVerified: "2026-03-22",
    disclaimer: false,
    maintainers: ["@core"],
    name: { en: "CI hygiene", ar: "نظافة CI" },
    plain: {
      en: "If your repo has no CI, the agent adds one. If it does, the agent keeps it honest — no skipping tests to get green.",
      ar: "إذا لم يكن لمستودعك CI، يُضيفه الوكيل. وإذا وُجد، يُبقيه نظيفًا — بدون تخطّي اختبارات لتحصل على لون أخضر.",
    },
    desc: { en: "Lint, typecheck, tests, and migration hygiene — expressed as rules the agent can actually enforce.", ar: "Lint وفحص الأنواع والاختبارات ونظافة الترحيلات — كقواعد يستطيع الوكيل فرضها." },
    targets: ["claude", "cursor", "codex", "generic"],
    variables: [],
    references: 0,
    scripts: 1,
    sources: [],
  },
];

// Trigger logic — maps answers to recommended skill ids
function recommendedSkillIds(answers) {
  const rec = new Set();
  const a = answers || {};
  const ksa = a.market === "ksa" || a.market === "gcc";

  if (ksa && a.invoicing) rec.add("zatca-phase2");
  if (ksa && a.pii) rec.add("pdpl-basics");
  if (ksa && a.identity) rec.add("nafath-yakeen-basics");
  if (ksa && a.payments) rec.add("mada-stcpay-basics");

  // Universal
  if (a.secrets && a.secrets !== "manager") rec.add("secrets-baseline");
  if (a.identity || a.pii) rec.add("auth-isolation");
  if (!a.ci) rec.add("ci-hygiene");
  rec.add("testability-check");

  // Order: compliance first, then security, then architecture
  const order = { saudi: 0, security: 1, architecture: 2 };
  return [...rec].sort((x, y) => {
    const sx = SKILLS.find(s => s.id === x);
    const sy = SKILLS.find(s => s.id === y);
    return order[sx.category] - order[sy.category];
  });
}

// Sample Claude Code skill body (for hero + preview)
const SAMPLE_CLAUDE_BODY = `---
name: zatca-phase2
description: ZATCA Phase 2 e-invoicing rules for Saudi Arabia
version: 0.4.2
status: reviewed
last_verified: 2026-03-18
---

# ZATCA Phase 2

> This is engineering guidance, not legal advice. Verify every
> rule against the official ZATCA documentation linked in /sources.

## When this applies

You are working on a product that issues invoices to Saudi customers
and is using **Node.js** as the backend stack.

## Non-negotiables

- Every B2B invoice must be cleared with ZATCA **before** being
  delivered to the buyer.
- Every B2C invoice must be reported within **24 hours** of issuance.
- Every invoice XML must include a cryptographic stamp derived from
  the taxpayer's CSID certificate.

## Your stack specifics

\`\`\`ts
// Use the UBL builder — don't hand-roll the XML.
import { buildInvoiceXML, stamp } from "@zatca/ubl";
\`\`\`

See references/invoice-b2c.xml for a full sample.
`;

const SAMPLE_CURSOR_BODY = `---
description: ZATCA Phase 2 e-invoicing rules (Saudi Arabia)
globs: **/invoice*, **/billing/**
alwaysApply: false
---
# ZATCA Phase 2 — Cursor rule

> Engineering guidance only. Not legal advice. Check /sources.

- Every B2B invoice is cleared with ZATCA before delivery.
- Every B2C invoice is reported within 24 hours.
- Stamp every invoice XML using the CSID certificate.

## Note
Helper scripts are read-only guidance in Cursor. See full skill at
github.com/wathba-skills/skills/saudi/zatca-phase2.
`;

const SAMPLE_CODEX_BODY = `# AGENTS.md

_Generated by Wathba Skills · 2026-04-19_

This file tells your agent the rules of this repository. It
aggregates 4 skills selected during generation.

---

## ZATCA Phase 2 e-invoicing  ·  v0.4.2  ·  reviewed

> Engineering guidance, not legal advice.

- Clear B2B invoices before delivery.
- Report B2C invoices within 24 hours.
- Stamp every invoice XML with CSID.

## Secrets baseline  ·  v1.0.0  ·  reviewed

- Never commit .env files.
- Rotate any secret that was ever in git history.
- Prefer the chosen secret manager (none) over .env files.

## Auth boundary isolation  ·  v0.3.0  ·  community

- Keep admin code in a separate folder or package.
- Never check admin status inline in a user-facing handler.
- Audit-log privileged actions.

## Testability check  ·  v0.4.0  ·  community

- Isolate side effects at the edges.
- No module-level singletons for mutable state.
- Every new feature ships with at least one seam test.
`;

window.SKILLS = SKILLS;
window.recommendedSkillIds = recommendedSkillIds;
window.SAMPLE_CLAUDE_BODY = SAMPLE_CLAUDE_BODY;
window.SAMPLE_CURSOR_BODY = SAMPLE_CURSOR_BODY;
window.SAMPLE_CODEX_BODY = SAMPLE_CODEX_BODY;
