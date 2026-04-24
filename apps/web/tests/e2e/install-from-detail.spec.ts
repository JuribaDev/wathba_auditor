import { expect, test, type Page } from "@playwright/test";

// Clicking "Install this skill" on a public detail page should land the user
// on the generate flow with that skill preselected. We advance through the
// about + tech steps (the same auto-recommendation signals as the rest of
// the e2e suite) so the review step becomes reachable and the library
// preselect surfaces as a manual pick with a clear action.

async function fillAboutKsaPdpl(page: Page): Promise<void> {
  await page.locator("#market-ksa").click();
  await page.locator("#invoicing-no").click();
  await page.locator("#pii-yes").click();
  await page.locator("#payments-no").click();
  await page.locator("#identity-yes").click();
}

async function fillTechNodejsClaude(page: Page): Promise<void> {
  await page.locator("#stack-nodejs").click();
  await page.locator("#agents-claude-code").click();
  await page.locator("#ci-yes").click();
  await page.locator("#secrets-manager").click();
}

test("EN: install-from-detail preselects the skill in the review step", async ({
  page,
}) => {
  // `architecture-ci-hygiene` is not an auto-recommendation for this
  // KSA/pii/identity/ci/secrets path, so if it appears as a manual pick on
  // the review step the preselection plumbing is what put it there.
  await page.goto("/en/skills/architecture-ci-hygiene/");
  await expect(
    page.locator("[data-slot='install-actions']"),
  ).toBeVisible();

  await page.locator("[data-action='install']").click();
  await expect(page).toHaveURL(
    /\/en\/generate\/?\?skill=architecture-ci-hygiene$/,
  );

  await fillAboutKsaPdpl(page);
  await page.getByRole("button", { name: "Continue" }).click();

  await fillTechNodejsClaude(page);
  await page.getByRole("button", { name: "Continue" }).click();

  // Review step: the "Selected from library" notice appears above the
  // recommendations and exposes a Clear action.
  const notice = page.locator("[data-slot='selected-from-library']");
  await expect(notice).toBeVisible();
  await expect(notice).toContainText(/Selected from library/i);
  await expect(notice).toContainText(/CI hygiene/i);
  await expect(
    page.locator("[data-slot='selected-from-library-clear']"),
  ).toBeVisible();
});

test("AR: install-from-detail preserves RTL and preselects via ?skill", async ({
  page,
}) => {
  await page.goto("/ar/skills/architecture-ci-hygiene/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.locator("[data-slot='install-actions']"),
  ).toBeVisible();

  await page.locator("[data-action='install']").click();
  await expect(page).toHaveURL(
    /\/ar\/generate\/?\?skill=architecture-ci-hygiene$/,
  );
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await fillAboutKsaPdpl(page);
  await page.getByRole("button", { name: "التالي" }).click();

  await fillTechNodejsClaude(page);
  await page.getByRole("button", { name: "التالي" }).click();

  const notice = page.locator("[data-slot='selected-from-library']");
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("تم اختيارها من المكتبة");
});
