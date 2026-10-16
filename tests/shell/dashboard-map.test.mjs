import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { signIn } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://localhost:3000";
test("dashboard dan Hotspot memakai seluruh marker dan cakupan nasional yang sama", { timeout: 90_000 }, async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const requests = [];
  const markers = Array.from({ length: 151 }, (_, index) => ({
    id: `map-regression-${index}`, latitude: -2, longitude: index === 150 ? 114 : 103,
    observed_at: new Date().toISOString(), frp_mw: 1,
    verification_status: "UNVERIFIED", list_offset: index,
  }));
  await page.route("**/api/v1/hotspots/map?**", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    await route.fulfill({ json: { mode: url.searchParams.get("mode"), items: markers } });
  });
  await signIn(page, baseURL, "coordinator", "/dashboard");
  await page.getByRole("button", { name: "Terkini", exact: true }).click();
  const map = page.locator('canvas[aria-label^="Peta titik panas, 151 titik sesuai filter."]');
  await map.waitFor();
  const current = requests.findLast((url) => url.searchParams.get("mode") === "CURRENT_MONITORING");
  assert.ok(current, "dashboard meminta seluruh marker, bukan halaman pertama daftar");
  assert.equal(current.searchParams.get("bbox"), "94,-11.5,141.5,6.5");
  assert.equal(current.searchParams.has("limit"), false);
  assert.equal(current.searchParams.has("offset"), false);
  await page.getByRole("link", { name: "Buka peta lengkap" }).click();
  await page.waitForURL("**/hotspots");
  await map.waitFor();
  await page.getByText("Peta menampilkan 151 titik sesuai filter, mencakup semua halaman daftar.").waitFor();
  assert.equal(await map.count(), 1);
});
