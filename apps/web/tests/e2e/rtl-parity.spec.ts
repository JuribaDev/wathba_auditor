import { expect, test } from "@playwright/test";

const coreRoutes = [
  "/",
  "/skills/",
  "/skills/saudi-zatca-phase2/",
  "/generate/",
  "/compare/",
] as const;

const directionByLocale = { en: "ltr", ar: "rtl" } as const;

for (const locale of ["en", "ar"] as const) {
  for (const route of coreRoutes) {
    test(`${locale} ${route} renders with the correct direction`, async ({ page }) => {
      await page.goto(`/${locale}${route}`);
      const html = page.locator("html");
      await expect(html).toHaveAttribute("dir", directionByLocale[locale]);
      await expect(html).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
}

test("compare canvas shows both LTR and RTL frames in Arabic", async ({ page }) => {
  await page.goto("/ar/compare/");
  const ltrFrame = page.locator('[dir="ltr"]').first();
  const rtlFrame = page.locator('[dir="rtl"]').first();
  await expect(ltrFrame).toBeVisible();
  await expect(rtlFrame).toBeVisible();
});
