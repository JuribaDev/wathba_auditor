import { expect, test } from "@playwright/test";

test("contributor route renders the action step by default", async ({ page }) => {
  await page.goto("/en/skills/contribute/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /What do you want to do/i,
  );
  const radiogroup = page.getByRole("radiogroup");
  await expect(radiogroup.getByRole("radio")).toHaveCount(4);
});

test("contributor route preloads add mode from action=add", async ({ page }) => {
  await page.goto("/en/skills/contribute/?action=add");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Skill metadata/i);
});

test("skills library exposes Add new skill CTA linking to the contributor route", async ({
  page,
}) => {
  await page.goto("/en/skills/");
  const cta = page.getByRole("link", { name: "Add new skill" });
  await expect(cta).toHaveAttribute(
    "href",
    "/en/skills/contribute?action=add",
  );
});

test("skill detail page exposes contributor action CTAs", async ({ page }) => {
  await page.goto("/en/skills/saudi-zatca-phase2/");
  await expect(
    page.locator("[data-slot='contributor-actions']"),
  ).toBeVisible();
  await expect(
    page.locator("[data-action='update']").first(),
  ).toContainText(/Update/i);
});

test("contributor wizard localizes to Arabic with RTL direction", async ({ page }) => {
  await page.goto("/ar/skills/contribute/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ما الذي تريد فعله؟");
});
