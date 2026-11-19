import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("stacks below 768px with no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  for (const n of ["01", "03", "04", "07", "08", "10"]) {
    await page.goto(`/#stop-${n}`);
    await page.locator(`#stop-${n}`).waitFor();
    await page.waitForTimeout(300);
    if (process.env.SHOTS) await page.screenshot({ path: `screenshots/mobile-${n}.png` });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator("#stop-01 details.deeper")).not.toHaveAttribute("open", "");
});
