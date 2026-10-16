import { signIn, switchRole } from "../shell/helpers.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

// Opt-in: this consumes one NASA request and persists real cache/sync history.
test("FIRMS live: sync browser, status database, cooldown dan pembatasan peran", {
  skip: process.env.LIVE_FIRMS_SYNC !== "1", timeout: 120_000,
}, async (t) => {
  const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3100";
  const apiURL = process.env.LIVE_API_BASE_URL ?? "http://127.0.0.1:8001/api/v1";
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(60_000);
  await page.addInitScript(() => localStorage.setItem("gambutops:guide-seen:v1", "1"));
  await signIn(page, baseURL, "coordinator", "/hotspots");
  await page.getByRole("button", { name: "Terkini", exact: true }).click();
  const panel = page.getByRole("region", { name: "Pembaruan data satelit (NASA FIRMS)" });
  const button = panel.getByRole("button", { name: "Sinkronkan Batanghari VIIRS Suomi NPP", exact: true });
  await button.waitFor();
  const responsePromise = page.waitForResponse((response) => response.url() === `${apiURL}/admin/hotspots/sync` && response.request().method() === "POST", { timeout: 90_000 });
  await button.click();
  const response = await responsePromise;
  const result = await response.json();
  assert.ok([200, 429].includes(response.status()), `sync ${response.status()}: ${JSON.stringify(result)}`);
  if (response.status() === 200) {
    assert.equal(result.status, "SUCCESS");
    await page.getByText("Sinkronisasi selesai", { exact: true }).waitFor();
    const statuses = await page.evaluate(async (url) => (await fetch(`${url}/hotspots/sync-status`)).json(), apiURL);
    const target = statuses.find((item) => item.area_id === "batanghari" && item.source_product === "VIIRS_SNPP_NRT");
    assert.equal(target.status, "SUCCESS");
    assert.equal(target.last_attempt.id, result.id);
    assert.ok(target.last_successful_at);
    const again = page.waitForResponse((item) => item.url() === `${apiURL}/admin/hotspots/sync` && item.request().method() === "POST");
    await button.click();
    assert.equal((await again).status(), 429);
  }
  await page.getByText("Sinkronisasi gagal", { exact: true }).waitFor();
  await switchRole(page, "field_officer");
  assert.equal(await panel.getByRole("button", { name: /^Sinkronkan / }).count(), 0);
  console.log(`FIRMS live verified: status=${response.status()}, rows=${result.rows_received ?? "cooldown"}`);
});
