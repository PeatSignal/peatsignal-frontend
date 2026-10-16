import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { selectOption } from "../helpers/select.mjs";
import { signIn, switchRole } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";

test("ringkasan: kartu perhatian, angka, peta, kegiatan, dan peran demo", { timeout: 120_000 }, async (t) => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem("gambutops:guide-seen:v1", "1"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  // Belum masuk: diarahkan ke login dengan tujuan semula.
  await page.goto(`${baseURL}/dashboard`);
  await page.waitForURL((url) => url.pathname === "/login" && url.searchParams.get("next") === "/dashboard");
  await signIn(page, baseURL, "coordinator", "/dashboard");
  const main = page.locator("main");
  await page.getByRole("heading", { name: "Ringkasan pemantauan", level: 1 }).waitFor();
  await main.getByRole("heading", { name: "Perlu diperiksa lebih dulu" }).waitFor();
  await main.getByRole("heading", { name: "Tugas yang menunggu Anda" }).waitFor();
  await page.getByRole("button", { name: /^Keluar/ }).waitFor();

  // Empat angka ringkasan, masing-masing menuju halamannya.
  const tiles = page.getByLabel("Angka ringkasan").getByRole("link");
  await tiles.first().waitFor();
  assert.equal(await tiles.count(), 4);
  assert.deepEqual(await tiles.evaluateAll((links) => links.map((link) => new URL(link.href).pathname)), ["/hotspots", "/priorities", "/tasks", "/groundwater"]);

  await main.locator('[data-map-status="ready"]').waitFor({ timeout: 20_000 });
  await main.getByRole("heading", { name: "Kegiatan terbaru" }).waitFor();
  await main.getByText(/^Data sampai /).waitFor();

  // Ganti peran: kartu tugas mengikuti peran petugas.
  await switchRole(page, "field_officer");
  await main.getByRole("heading", { name: "Tugas yang menunggu Anda" }).waitFor();

  // Filter wilayah ikut mengubah ringkasan.
  await selectOption(page.getByRole("combobox", { name: "Wilayah", exact: true }), { label: "Kubu Raya, Kalimantan Barat" });
  await main.getByText(/^Kubu Raya, Kalimantan Barat · /).waitFor();

  await tiles.nth(2).click();
  await page.waitForURL("**/tasks");

  // HP: tanpa overflow.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${baseURL}/dashboard`);
  await main.getByRole("heading", { name: "Perlu diperiksa lebih dulu" }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);

  assert.deepEqual(errors, [], "tanpa error browser");
});
