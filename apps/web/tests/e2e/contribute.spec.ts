import { expect, test } from "@playwright/test";

test("contributor route renders the action step by default", async ({ page }) => {
  await page.goto("/en/skills/contribute/");
  await expect(
    page
      .getByRole("heading", { level: 1 })
      .filter({ hasText: /What do you want to do/i }),
  ).toBeVisible();
  // Scope to the action-step radiogroup so we don't pick up unrelated
  // radiogroups on the page (e.g. theme/color controls in the app shell).
  const actionGroup = page.getByRole("radiogroup", {
    name: /What do you want to do/i,
  });
  await expect(actionGroup.locator("[data-action]")).toHaveCount(4);
});

test("contributor route preloads add mode from action=add", async ({ page }) => {
  await page.goto("/en/skills/contribute/?action=add");
  await expect(
    page
      .getByRole("heading", { level: 1 })
      .filter({ hasText: /Skill metadata/i }),
  ).toBeVisible();
});

test("contributor route explains the agent-handoff flow up front", async ({
  page,
}) => {
  await page.goto("/en/skills/contribute/?action=add");
  const flowPurpose = page.locator("[data-slot='contribute-flow-purpose']");
  await expect(flowPurpose).toBeVisible();
  await expect(flowPurpose).toContainText(/How this flow works/i);
  await expect(flowPurpose).toContainText(
    /You are not publishing from the browser/i,
  );
});

test("skills library exposes a visible contributor-brief CTA linking to the contributor route", async ({
  page,
}) => {
  await page.goto("/en/skills/");
  const cta = page.locator("[data-slot='skills-add-cta']");
  await expect(cta).toBeVisible();
  await expect(cta).toContainText("Draft skill brief");
  await expect(cta).toContainText(
    /Wathba generates a repo-aware prompt for Claude Code, Cursor, Codex/i,
  );
  // Next may normalize the emitted href to include a trailing slash
  // under `output: "export"`, so accept either shape.
  await expect(cta).toHaveAttribute(
    "href",
    /^\/en\/skills\/contribute\/?\?action=add$/,
  );
});

test("skill detail page exposes install CTAs and no longer surfaces contributor-maintenance actions", async ({
  page,
}) => {
  await page.goto("/en/skills/saudi-zatca-phase2/");

  // Public detail route is read/install-only now. Maintainer workflows
  // (update/retire/delete/reactivate) live in the contributor flow.
  await expect(
    page.locator("[data-slot='contributor-actions']"),
  ).toHaveCount(0);
  for (const action of ["update", "retire", "delete", "reactivate"]) {
    await expect(page.locator(`[data-action='${action}']`)).toHaveCount(0);
  }

  const installActions = page.locator("[data-slot='install-actions']");
  await expect(installActions).toBeVisible();
  await expect(installActions).toContainText(/Install this skill/i);
  await expect(installActions).toContainText(/Open install options/i);

  const installCta = page.locator("[data-action='install']");
  await expect(installCta).toBeVisible();
  await expect(installCta).toHaveAttribute(
    "href",
    /^\/en\/generate\/?\?skill=saudi-zatca-phase2$/,
  );

  const optionsCta = page.locator("[data-action='install-options']");
  await expect(optionsCta).toBeVisible();
  await expect(optionsCta).toHaveAttribute(
    "href",
    /^\/en\/generate\/?$/,
  );
});

test("contributor wizard localizes to Arabic with RTL direction", async ({ page }) => {
  await page.goto("/ar/skills/contribute/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page
      .getByRole("heading", { level: 1 })
      .filter({ hasText: "ما الذي تريد فعله؟" }),
  ).toBeVisible();
});
