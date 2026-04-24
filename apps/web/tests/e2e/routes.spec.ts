import { expect, test } from "@playwright/test";

test("landing page renders in English", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Give your AI coding agent",
  );
});

test("skill detail renders in Arabic", async ({ page }) => {
  await page.goto("/ar/skills/saudi-zatca-phase2/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("الفوترة الإلكترونية");
});

test("migrator renders the agent-driven approval flow", async ({ page }) => {
  await page.goto("/en/migrate/");
  const preview = page.locator("[data-slot='migration-prompt-preview']");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Skill migrator",
  );
  await expect(page.getByText("Approval required")).toBeVisible();
  await expect(page.getByText("One-time agent prompt")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Reusable migrator skill" }),
  ).toBeVisible();
  await expect(preview).toContainText("Do not create, edit, move, or delete files");
  await expect(preview).toContainText("skill-creator");

  await page.locator("#migration-target-agents-md").click();
  await expect(preview).toContainText("AGENTS.md target rule");
  await expect(preview).toContainText("do not overwrite it");

  await page.locator("#migration-target-custom").click();
  await expect(preview).toContainText("Custom target rule");
  await expect(preview).toContainText("target agent's expected root path");
});

test("locale-less public routes redirect to English pages", async ({ page }) => {
  const cases = [
    ["/skills/", /\/en\/skills\/$/],
    ["/skills/saudi-zatca-phase2/", /\/en\/skills\/saudi-zatca-phase2\/$/],
    ["/generate/?skill=architecture-ci-hygiene", /\/en\/generate\/\?skill=architecture-ci-hygiene$/],
    ["/skills/contribute/?action=add", /\/en\/skills\/contribute\/\?action=add$/],
    ["/migrate/", /\/en\/migrate\/$/],
  ] as const;

  for (const [source, target] of cases) {
    await page.goto(source);
    await expect(page).toHaveURL(target);
  }
});
