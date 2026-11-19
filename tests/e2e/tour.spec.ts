import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const shot = (page: Page, name: string) => (process.env.SHOTS ? page.screenshot({ path: `screenshots/${name}.png` }) : Promise.resolve());
const stop = (page: Page, n: number) => page.locator(`#stop-${String(n).padStart(2, "0")}`);
const progress = (page: Page) => page.locator(".progress");

/** The stop, in its current (expanded) state, still fits below the sticky nav. */
async function fits(page: Page, n: number) {
  const { stopH, navH, vh } = await stop(page, n).evaluate((el) => ({
    stopH: el.getBoundingClientRect().height,
    navH: document.querySelector(".topbar")!.getBoundingClientRect().height,
    vh: innerHeight,
  }));
  expect.soft(stopH, `stop ${n} height after interaction`).toBeLessThanOrEqual(vh - navH + 2);
}

async function goto(page: Page, n: number) {
  await page.locator(".topbar").waitFor();
  await page.keyboard.press(n === 10 ? "0" : String(n));
  await expect(page).toHaveURL(new RegExp(`#stop-${String(n).padStart(2, "0")}`));
  await expect(stop(page, n)).toBeVisible();
  await page.waitForTimeout(400);
}

test("the full tour: 10 dares, 10 stamps, carry-over and the finale", async ({ page }) => {
  const consoleProblems: string[] = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && consoleProblems.push(m.text().split("\n")[0]!));
  page.on("pageerror", (e) => consoleProblems.push(e.message));
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await shot(page, "00-intro");

  // 01 tokens: make it unreadable, save, guard snaps back
  await goto(page, 1);
  const s1 = stop(page, 1).locator(".stage");
  await s1.getByLabel(/Brand lightness/).fill("90");
  await expect(s1.getByText("Fails AA")).toBeVisible();
  await shot(page, "01-tokens-failing");
  await s1.getByRole("button", { name: "Save brand colour" }).click();
  await expect(s1.getByText(/^Guard:/)).toBeVisible();
  await expect(progress(page)).toContainText("1 of 10");
  await shot(page, "01-tokens-snapped");
  await fits(page, 1);
  await s1.getByLabel("Dark", { exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await shot(page, "01-tokens-dark");

  // 02 governance
  await goto(page, 2);
  const s2 = stop(page, 2).locator(".stage");
  await s2.getByRole("button", { name: "Submit for review" }).click();
  await expect(s2.getByText(/Missing focus state/)).toBeVisible();
  await shot(page, "02-governance-bounced");
  await fits(page, 2);
  await s2.getByLabel("Focus state").check();
  await s2.getByRole("button", { name: /Resubmit|Submit/ }).click();
  await expect(s2.getByText(/All 6 checks pass/)).toBeVisible();
  await shot(page, "02-governance-approved");

  // 03 accessibility: real axe-core run, 5 fixes
  await goto(page, 3);
  const s3 = stop(page, 3).locator(".stage");
  await expect(s3.locator(".s03-score-num")).toHaveText("41");
  await s3.getByRole("button", { name: "Run check" }).click();
  await expect(s3.locator(".issue")).toHaveCount(5);
  await shot(page, "03-a11y-issues");
  await fits(page, 3);
  for (let i = 0; i < 5; i++) {
    await s3.locator(".issue").first().getByRole("button", { name: /^Fix/ }).click();
    await expect(s3.locator(".issue")).toHaveCount(4 - i);
  }
  await expect(s3.locator(".s03-score-num")).toHaveText("100");
  await shot(page, "03-a11y-fixed");

  // 04 agent: goal, sliders, pause mid-stream, redirect, approve
  await goto(page, 4);
  const s4 = stop(page, 4).locator(".stage");
  await s4.getByRole("button", { name: "Plan it" }).click();
  await s4.getByRole("button", { name: "Start the agent" }).click();
  await expect(s4.locator(".plan-item:not(.is-ghost)")).toHaveCount(2, { timeout: 10_000 });
  await s4.getByRole("button", { name: /Pause/ }).click();
  await shot(page, "04-agent-paused");
  await s4.getByRole("button", { name: "more Figma" }).click();
  await expect(s4.getByRole("button", { name: "Approve plan" })).toBeVisible({ timeout: 15_000 });
  await expect(s4.getByText(/Scripted run/)).toBeVisible();
  await shot(page, "04-agent-review");
  await fits(page, 4);
  await s4.getByRole("button", { name: "Approve plan" }).click();
  await expect(progress(page)).toContainText("4 of 10");

  // 05 copy: push tone to chaotic, catch the rule break, save a clean one
  await goto(page, 5);
  const s5 = stop(page, 5).locator(".stage");
  await s5.getByLabel(/Tone/).fill("3");
  await s5.getByRole("button", { name: "Write 3 options" }).click();
  await expect(s5.getByText(/Caught: No exclamation marks/)).toBeVisible();
  await expect(s5.locator("mark.rule-hit")).toHaveText("!");
  await shot(page, "05-copy-caught");
  await fits(page, 5);
  await s5.getByRole("button", { name: "Save this one" }).first().click();
  await s5.getByLabel("Show prompt").check();
  await shot(page, "05-copy-prompt");

  // 06 trust: the plan from 04 is back; fix 4 weeks → 2, then undo
  await goto(page, 6);
  const s6 = stop(page, 6).locator(".stage");
  await expect(s6.getByText(/Nobody asked/)).toBeVisible();
  await expect(s6.getByText(/sample plan/)).toHaveCount(0); // it's the visitor's plan from stop 04
  await s6.getByRole("button", { name: "2 wk" }).click();
  await expect(s6.getByText("2-week schedule")).toBeVisible();
  await expect(s6.locator(".plan-item[data-changed]")).toHaveCount(2);
  await shot(page, "06-trust-fixed");
  await fits(page, 6);
  await page.keyboard.press("Control+z");
  await expect(s6.getByText("4-week schedule")).toBeVisible();
  await shot(page, "06-trust-undone");

  // 07 research: mark the weak theme unvalidated
  await goto(page, 7);
  const s7 = stop(page, 7).locator(".stage");
  await expect(s7.getByText(/Rejected 1 AI theme/)).toBeVisible();
  await shot(page, "07-research-start");
  await s7.getByRole("region", { name: "Everyone wants dark mode" }).getByRole("button", { name: "Mark unvalidated" }).click();
  await expect(s7.locator(".scorecard .is-ok")).toBeVisible();
  await shot(page, "07-research-honest");
  await fits(page, 7);

  // 08 states: click the blank cell
  await goto(page, 8);
  const s8 = stop(page, 8).locator(".stage");
  await shot(page, "08-states-blank");
  await s8.getByRole("button", { name: /Empty cell/ }).click();
  await expect(s8.getByLabel("Generated JSX")).toContainText("loading");
  await shot(page, "08-states-revealed");
  await fits(page, 8);

  // 09 MCP: build one, refuse one
  await goto(page, 9);
  const s9 = stop(page, 9).locator(".stage");
  await s9.getByRole("button", { name: "Try: canceled subscription" }).click();
  await expect(s9.getByText("Your plan is paused")).toBeVisible({ timeout: 15_000 });
  await s9.getByLabel("Inspect").check();
  await shot(page, "09-mcp-built");
  await fits(page, 9);
  await s9.getByRole("button", { name: "Try: neon carousel" }).click();
  await expect(s9.getByText(/won't invent one/)).toBeVisible({ timeout: 15_000 });
  await shot(page, "09-mcp-refused");

  // 10 generative UI: goal, swap, reorder, undo → 10th stamp
  await goto(page, 10);
  const s10 = stop(page, 10).locator(".stage");
  await s10.getByLabel("Plan a trip").check();
  await shot(page, "10-genui-trip");
  await s10.getByRole("button", { name: "list" }).first().click();
  await s10.getByRole("button", { name: /Move .* down/ }).click();
  await shot(page, "10-genui-swapped");
  await fits(page, 10);
  await s10.getByRole("button", { name: /^Undo/ }).click();
  await expect(progress(page)).toContainText("10 of 10");

  // Finale
  await stop(page, 10).getByRole("button", { name: /See your card/ }).click();
  await expect(page).toHaveURL(/#finale/);
  await expect(stop(page, 10)).toBeHidden();
  await expect(page.getByText("Passport full.")).toBeVisible();
  await expect(page.getByRole("article", { name: "Your plan card" })).toContainText("Ship a portfolio case study");
  await page.waitForTimeout(1000);
  await shot(page, "11-finale");
  expect(consoleProblems, "no console errors, React warnings or invalid HTML nesting").toEqual([]);
});

test("keyboard navigation and deep links", async ({ page }) => {
  await page.goto("/#stop-04");
  await page.waitForTimeout(500);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#stop-05/);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/#stop-03/);
  await expect(page.locator("section.stop:not([hidden])")).toHaveCount(1);
  await expect(page.locator("#stop-03")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#stop-04/);
  await expect(page.locator("#stop-04")).toBeVisible();
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: "Shortcuts" })).toBeVisible();
  await shot(page, "12-shortcuts");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

for (const [w, h] of [[1440, 900], [1280, 800]] as const) {
  test(`every stop fits one screen below the sticky nav at ${w}×${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");
    for (let n = 1; n <= 10; n++) {
      await goto(page, n);
      const { stopH, navH } = await stop(page, n).evaluate((el) => ({
        stopH: el.getBoundingClientRect().height,
        navH: document.querySelector(".topbar")!.getBoundingClientRect().height,
      }));
      expect.soft(stopH, `stop ${n} height`).toBeLessThanOrEqual(h - navH + 2);
    }
  });
}

for (const theme of ["light", "dark", "hc"] as const) {
  test(`zero axe violations in ${theme} theme`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate((t) => localStorage.setItem("dbm:v1", JSON.stringify({ theme: t })), theme);
    await page.reload();
    for (let n = 1; n <= 10; n++) await goto(page, n); // load every stage
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .exclude('[data-axe-demo="intentional-issues"]') // stop 03's broken-on-purpose form
      .analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`);
    expect(summary).toEqual([]);
  });
}
