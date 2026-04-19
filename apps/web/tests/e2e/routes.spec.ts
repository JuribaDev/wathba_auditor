import { expect, test } from "@playwright/test";

test("landing page renders in English", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Open-source skill packs");
});

test("skill detail renders in Arabic", async ({ page }) => {
  await page.goto("/ar/skills/saudi-zatca-phase2/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("الفوترة الإلكترونية");
});
