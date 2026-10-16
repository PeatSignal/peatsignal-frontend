import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { selectOption } from "../helpers/select.mjs";
import { signIn } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";
const require = createRequire(import.meta.url);
const { version: maplibreVersion } = require("maplibre-gl/package.json");

async function openHotspots(browser, { blockBasemap = false, badWorkerMime = false, disableWebgl = false, noFullscreenApi = false, width = 1440, height = 900 } = {}) {
  const mobile = width < 768;
  const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(({ disableWebgl, noFullscreenApi }) => {
    localStorage.setItem("gambutops:guide-seen:v1", "1");
    // iPhone Safari: Fullscreen API tidak tersedia untuk elemen biasa.
    if (noFullscreenApi) Object.defineProperty(Document.prototype, "fullscreenEnabled", { get: () => false });
    if (disableWebgl) {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return String(type).startsWith("webgl") ? null : original.call(this, type, ...args);
      };
    }
  }, { disableWebgl, noFullscreenApi });
  if (blockBasemap) await context.route(/tiles\.openfreemap\.org/, (route) => route.abort());
  if (badWorkerMime) await context.route("**/vendor/**/maplibre-gl-worker.js", (route) => route.fulfill({ contentType: "text/plain", body: "// Invalid module worker MIME" }));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signIn(page, baseURL, "coordinator", "/hotspots");
  return { context, page, errors, map: page.locator("main [data-map-status]") };
}

async function waitForStatus(map, statuses) {
  await map.waitFor();
  await map.page().waitForFunction(
    ([element, wanted]) => wanted.includes(element.getAttribute("data-map-status")),
    [await map.elementHandle(), statuses],
    { timeout: 20_000 },
  );
  return map.getAttribute("data-map-status");
}

test("peta: wilayah mengikuti filter, peta dasar gagal, dan tanpa WebGL", { timeout: 120_000 }, async (t) => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  t.after(() => browser.close());

  await t.test("worker dan import pendukung disajikan sebagai JavaScript", async () => {
    const context = await browser.newContext();
    try {
      for (const name of ["worker", "shared"]) {
        const response = await context.request.get(`${baseURL}/vendor/maplibre-gl-${maplibreVersion}/maplibre-gl-${name}.js`);
        assert.equal(response.status(), 200);
        assert.match(response.headers()["content-type"], /^(application|text)\/javascript\b/);
        const source = await response.text();
        assert.doesNotMatch(source, /["']\.\/[^"']+\.mjs["']/);
        if (name === "worker") assert.match(source, /["']\.\/maplibre-gl-shared\.js["']/);
      }
    } finally {
      await context.close();
    }
  });

  await t.test("MIME worker salah: tampilkan error dan tombol coba lagi", async () => {
    const { context, page, map } = await openHotspots(browser, { badWorkerMime: true, blockBasemap: true });
    try {
      assert.equal(await waitForStatus(map, ["error"]), "error");
      await page.getByRole("alert").filter({ hasText: "Peta tidak dapat ditampilkan" }).waitFor();
      await page.getByRole("button", { name: "Coba lagi" }).waitFor();
      await context.unroute("**/vendor/**/maplibre-gl-worker.js");
      await page.getByRole("button", { name: "Coba lagi" }).click();
      assert.equal(await waitForStatus(map, ["ready"]), "ready");
    } finally {
      await context.close();
    }
  });

  await t.test("peta tampil dan mengikuti filter wilayah", async () => {
    const { context, page, errors, map } = await openHotspots(browser);
    assert.equal(await waitForStatus(map, ["ready"]), "ready");
    const canvas = page.getByRole("region", { name: /^Peta titik panas, \d+ titik/ });
    await canvas.waitFor();
    assert.equal(await page.getByRole("button", { name: "Perbesar" }).count(), 1, "kontrol zoom berbahasa Indonesia");
    await selectOption(page.getByRole("combobox", { name: "Wilayah", exact: true }), { label: "Kubu Raya, Kalimantan Barat" });
    await page.getByRole("region", { name: /^Peta titik panas Kubu Raya, Kalimantan Barat/ }).waitFor();
    assert.deepEqual(errors, []);
    await context.close();
  });

  for (const [name, options] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 375, height: 740 }],
    ["mobile tanpa Fullscreen API (iPhone)", { width: 375, height: 740, noFullscreenApi: true }],
  ]) {
    await t.test(`layar penuh: ${name}`, async () => {
      const { context, page, errors, map } = await openHotspots(browser, options);
      await waitForStatus(map, ["ready"]);
      const enter = page.getByRole("button", { name: "Layar penuh", exact: true });
      await enter.click();
      const frame = page.getByRole("dialog", { name: /\(layar penuh\)$/ });
      await frame.waitFor();
      await page.waitForTimeout(300);
      const box = await frame.boundingBox();
      assert.deepEqual([box.x, box.y, box.width, box.height].map(Math.round), [0, 0, options.width, options.height], "peta menutup seluruh layar");
      const canvas = await page.locator(".maplibregl-canvas").boundingBox();
      assert.equal(Math.round(canvas.width), options.width, "kanvas peta ikut melebar");
      const exit = page.getByRole("button", { name: "Keluar layar penuh" });
      assert.equal(await exit.evaluate((element) => element === document.activeElement), true, "fokus pada tombol keluar");
      assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "hidden", "halaman di belakang tidak ikut tergulir");
      if (options.noFullscreenApi) await exit.click();
      else await page.keyboard.press("Escape");
      await frame.waitFor({ state: "detached" });
      await enter.waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "", "gulir halaman dipulihkan");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, "tanpa overflow");
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  await t.test("peta dasar diblokir: latar polos + pemberitahuan", async () => {
    const { context, page, errors, map } = await openHotspots(browser, { blockBasemap: true });
    assert.equal(await waitForStatus(map, ["ready"]), "ready");
    await page.getByText("Peta dasar tidak termuat", { exact: false }).waitFor();
    assert.deepEqual(errors, []);
    await context.close();
  });

  await t.test("tanpa WebGL: pesan jelas dan halaman tetap bisa dipakai", async () => {
    const { context, page, errors, map } = await openHotspots(browser, { disableWebgl: true, width: 375 });
    assert.equal(await waitForStatus(map, ["no-webgl"]), "no-webgl");
    const alert = page.getByRole("alert").filter({ hasText: "Peta tidak dapat ditampilkan" });
    await alert.waitFor();
    await alert.getByRole("button", { name: "Coba lagi" }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, "tanpa overflow 375px");
    assert.deepEqual(errors, []);
    await context.close();
  });
});
