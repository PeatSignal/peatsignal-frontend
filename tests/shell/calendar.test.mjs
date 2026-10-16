import { signIn } from "./helpers.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { selectOption } from "../helpers/select.mjs";
import { pickRange, selectCalendarDay } from "../helpers/calendar.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";

test("kalender: draft, batal, batas mode, rentang sehari, keyboard dan mobile", { timeout: 120_000 }, async (t) => {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, timezoneId: "Asia/Jakarta" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signIn(page, baseURL, "coordinator", "/groundwater");
  await page.getByRole("heading", { name: "Grafik muka air tanah harian" }).waitFor();
  assert.equal(await page.getByRole("dialog", { name: "Panduan penggunaan PeatSignal" }).count(), 0);
  assert.equal(await page.locator('input[type="date"], input[type="datetime-local"]').count(), 0);
  const trigger = page.getByRole("button", { name: "Periode", exact: true });
  const calendar = page.getByRole("dialog", { name: "Pilih periode" });
  const screenshotDir = process.env.UI_SCREENSHOT_DIR;
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
  const initial = await trigger.getAttribute("data-from");
  await trigger.click();
  await selectCalendarDay(calendar, "2019-08-01");
  assert.equal(await trigger.getAttribute("data-from"), initial, "draft tidak mengubah filter");
  assert.equal(await calendar.locator("[data-selected=true]").count(), 1, "sorotan hanya tanggal awal draft");
  assert.equal(await calendar.getByRole("button", { name: "Terapkan" }).isDisabled(), true);
  await calendar.getByRole("button", { name: "Batal" }).click();
  assert.equal(await trigger.getAttribute("data-from"), initial);
  assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
  await trigger.click();
  await selectCalendarDay(calendar, "2019-08-02");
  await page.keyboard.press("Escape");
  assert.equal(await trigger.getAttribute("data-from"), initial, "Escape membatalkan draft");

  await pickRange(page, "2019-08-01", "2019-08-10");
  assert.equal(await trigger.getAttribute("data-from"), "2019-08-01");
  assert.equal(await trigger.getAttribute("data-to"), "2019-08-10");
  // Filter dibawa ke halaman lain dengan navigasi klien.
  await page.locator("aside").getByRole("link", { name: "Titik panas", exact: true }).click();
  assert.equal(await trigger.getAttribute("data-from"), "2019-08-01");
  await page.getByRole("button", { name: "Terkini", exact: true }).click();
  assert.notEqual(await trigger.getAttribute("data-from"), "2019-08-01");
  await page.getByRole("button", { name: "Riwayat", exact: true }).click();
  assert.equal(await trigger.getAttribute("data-to"), "2019-08-10");
  await pickRange(page, "2019-08-03", "2019-08-03");
  assert.equal(await trigger.getAttribute("data-from"), "2019-08-03");
  assert.equal(await trigger.getAttribute("data-to"), "2019-08-03");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  assert.equal(await trigger.getAttribute("data-from"), initial);

  await trigger.click();
  await selectOption(calendar.getByRole("combobox", { name: "Tahun", exact: true }), "2018");
  await selectOption(calendar.getByRole("combobox", { name: "Bulan", exact: true }), "3");
  assert.equal(await calendar.locator('[data-day="2018-04-07"] button').isDisabled(), true);
  await calendar.locator('[data-day="2018-04-08"] button').focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await calendar.locator('[data-day="2018-04-09"] button').evaluate((el) => el === document.activeElement), true);
  await page.keyboard.press("Escape");
  for (const width of [1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await trigger.click();
    await calendar.waitFor();
    const box = await calendar.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width, `kalender muat pada ${width}px`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/calendar-${width}.png` });
    await page.keyboard.press("Escape");
  }
  for (const route of ["dashboard", "groundwater", "hotspots", "priorities", "tasks", "experiments/ml"]) {
    await page.goto(`${baseURL}/${route}`);
    await page.locator("main").getByRole("heading", { level: 1 }).waitFor();
    await page.waitForFunction(() => document.querySelector('main [data-slot="skeleton"]') === null);
    if (route === "priorities") {
      const details = page.locator("main article details").first();
      assert.equal(await details.getAttribute("open"), null);
      await details.locator("summary").first().focus();
      await page.keyboard.press("Enter");
      await details.getByText(/heuristik, belum divalidasi ilmiah/).waitFor();
      await details.locator("summary").first().click();
    }
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route}: ${width}px`);
      if (screenshotDir && [1440, 375].includes(width)) await page.screenshot({ path: `${screenshotDir}/${route.replaceAll("/", "-")}-${width}.png`, fullPage: true });
    }
  }
  assert.deepEqual(errors, []);
});
