import { promises as fs } from "node:fs";

import JSZip from "jszip";
import { expect, test, type Page } from "@playwright/test";

async function fillAboutKsaPdpl(page: Page): Promise<void> {
  await page.locator("#market-ksa").click();
  await page.locator("#invoicing-no").click();
  await page.locator("#pii-yes").click();
  await page.locator("#payments-no").click();
  await page.locator("#identity-yes").click();
}

async function fillTechNodejsClaudeCursor(page: Page): Promise<void> {
  await page.locator("#stack-nodejs").click();
  await page.locator("#agents-claude-code").click();
  await page.locator("#agents-cursor").click();
  await page.locator("#ci-yes").click();
  await page.locator("#secrets-manager").click();
}

async function readDownloadedZip(page: Page, clickLabel: string | RegExp) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: clickLabel }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const buffer = await fs.readFile(downloadPath!);
  const zip = await JSZip.loadAsync(buffer);
  return { zip, filename: download.suggestedFilename() };
}

test("EN: questionnaire to multi-target zip download", async ({ page }) => {
  await page.goto("/en/generate/");

  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await fillAboutKsaPdpl(page);
  await page.getByRole("button", { name: "Continue" }).click();

  await fillTechNodejsClaudeCursor(page);
  await page.getByRole("button", { name: "Continue" }).click();

  // Review: auto-recommendations are seeded. Advance to generate step.
  await page.getByRole("button", { name: "Generate skill pack" }).click();

  await expect(page.locator('[data-slot="download-panel"]')).toBeVisible();

  const { zip, filename } = await readDownloadedZip(page, "Download zip");

  expect(filename).toMatch(/^wathba-skills-\d{4}-\d{2}-\d{2}\.zip$/);

  const paths = Object.keys(zip.files).sort();

  // Multi-target: Claude Code + Cursor both emit at least one file.
  const claudeFiles = paths.filter((p) => p.startsWith(".claude/skills/"));
  const cursorFiles = paths.filter((p) => p.startsWith(".cursor/rules/"));
  expect(claudeFiles.length).toBeGreaterThan(0);
  expect(cursorFiles.length).toBeGreaterThan(0);

  // Each selected skill has a Claude SKILL.md and a Cursor .mdc rule.
  const claudeSkillMdCount = paths.filter((p) =>
    /^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(p),
  ).length;
  const cursorRuleCount = paths.filter((p) =>
    /^\.cursor\/rules\/[^/]+\.mdc$/.test(p),
  ).length;
  expect(claudeSkillMdCount).toBe(cursorRuleCount);
  expect(claudeSkillMdCount).toBeGreaterThanOrEqual(1);

  // Expected auto-recommendations for KSA + pii + identity (no invoicing,
  // no payments, secrets=manager, ci=yes): pdpl-basics, nafath-yakeen-basics,
  // auth-isolation, testability-check.
  const expectedSlugs = [
    "pdpl-basics",
    "nafath-yakeen-basics",
    "auth-isolation",
    "testability-check",
  ];
  for (const slug of expectedSlugs) {
    expect(paths).toContain(`.claude/skills/${slug}/SKILL.md`);
    expect(paths).toContain(`.cursor/rules/${slug}.mdc`);
  }

  // Sanity: at least one SKILL.md carries the expected frontmatter shape.
  const sampleBody = await zip
    .file(".claude/skills/testability-check/SKILL.md")!
    .async("string");
  expect(sampleBody.startsWith("---")).toBe(true);
  expect(sampleBody).toMatch(/name:\s*testability-check/);
});

test("AR: questionnaire to download preserves RTL and produces Codex AGENTS.md", async ({
  page,
}) => {
  await page.goto("/ar/generate/");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");

  await fillAboutKsaPdpl(page);
  await page.getByRole("button", { name: "التالي" }).click();

  await page.locator("#stack-nodejs").click();
  await page.locator("#agents-claude-code").click();
  await page.locator("#agents-codex").click();
  await page.locator("#ci-yes").click();
  await page.locator("#secrets-manager").click();
  await page.getByRole("button", { name: "التالي" }).click();

  await page.getByRole("button", { name: "أنشئ حزمة المهارات" }).click();

  // RTL must survive through the generate step.
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('[data-slot="download-panel"]')).toBeVisible();

  const { zip } = await readDownloadedZip(page, "تنزيل الحزمة");
  const paths = Object.keys(zip.files).sort();

  // Multi-target: Claude Code per-skill tree + single Codex AGENTS.md file.
  expect(paths.filter((p) => p.startsWith(".claude/skills/")).length).toBeGreaterThan(0);
  expect(paths).toContain("AGENTS.md");

  // The Codex AGENTS.md carries the per-skill headings for selected skills.
  const agentsMdBody = await zip.file("AGENTS.md")!.async("string");
  expect(agentsMdBody).toMatch(/# AGENTS\.md/);
  expect(agentsMdBody).toMatch(/PDPL Basics for Engineers/);
  expect(agentsMdBody).toMatch(/Nafath and Yakeen Identity Onboarding/);
});
