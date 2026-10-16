import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { selectOption } from "../helpers/select.mjs";
import { signIn } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";

test("shell: panduan, routing, jenis data, filter, sidebar, drawer, dan responsivitas", { timeout: 120_000 }, async (t) => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  // Panduan dibuka saat diminta setelah login.
  await signIn(page, baseURL, "coordinator", "/dashboard");
  assert.equal(await page.locator("html").getAttribute("lang"), "id");
  const guide = page.getByRole("dialog", { name: "Panduan penggunaan PeatSignal" });
  await page.getByRole("heading", { name: "Ringkasan pemantauan", level: 1 }).waitFor();
  assert.equal(await guide.count(), 0, "Panduan tidak terbuka otomatis");
  await page.getByRole("button", { name: "Buka panduan penggunaan" }).click();
  await guide.waitFor();
  assert.equal(await guide.getByRole("tab", { name: "Kenalan" }).getAttribute("aria-selected"), "true");
  await guide.getByRole("tab", { name: "Kenalan" }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await guide.getByRole("tab", { name: "Cara pakai" }).getAttribute("aria-selected"), "true");
  await guide.getByRole("button", { name: "Lanjut" }).click();
  await guide.getByRole("tab", { name: "Istilah" }).waitFor();
  assert.equal(await guide.getByRole("tab", { name: "Istilah" }).getAttribute("aria-selected"), "true");
  await guide.getByText("Titik panas (hotspot)").waitFor();
  await guide.getByRole("button", { name: "Tutup panduan" }).click();
  await guide.waitFor({ state: "hidden" });

  // Setelah ditutup, panduan tidak muncul lagi saat reload, tetapi bisa dibuka dari header.
  await page.reload();
  await page.getByRole("heading", { name: "Ringkasan pemantauan", level: 1 }).waitFor();
  await page.waitForTimeout(300);
  assert.equal(await guide.count(), 0, "Panduan tidak muncul ulang setelah ditutup");
  const helpButton = page.getByRole("button", { name: "Buka panduan penggunaan" });
  await helpButton.click();
  await guide.waitFor();
  assert.equal(await guide.getByRole("tab", { name: "Kenalan" }).getAttribute("aria-selected"), "true");
  await page.keyboard.press("Escape");
  await guide.waitFor({ state: "hidden" });
  assert.equal(await helpButton.evaluate((element) => element === document.activeElement), true, "Fokus kembali ke tombol Panduan");

  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, "Tidak boleh ada overflow horizontal pada 1440px");

  // Filter wilayah disimpan per jenis data.
  const area = page.getByLabel("Wilayah");
  await selectOption(area, { label: "Batanghari, Jambi" });
  await page.getByRole("button", { name: "Reset" }).waitFor();
  await page.getByRole("button", { name: "Terkini", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Terkini", exact: true }).getAttribute("aria-pressed"), "true");
  await page.locator("main").getByText("Data muka air terkini tidak tersedia", { exact: true }).waitFor();
  assert.equal(await area.getAttribute("data-value"), "", "Mode terkini memakai filternya sendiri");
  await page.getByRole("button", { name: "Riwayat", exact: true }).click();
  assert.equal(await area.getAttribute("data-value"), "batanghari", "Filter riwayat tetap tersimpan");
  await page.getByRole("button", { name: "Reset" }).click();
  assert.equal(await area.getAttribute("data-value"), "");
  await page.getByRole("button", { name: "Terkini", exact: true }).click();

  const modules = [
    ["Muka air tanah", "/groundwater", "Muka air tanah"],
    ["Titik panas", "/hotspots", "Titik panas satelit"],
    ["Prioritas pemeriksaan", "/priorities", "Prioritas pemeriksaan"],
    ["Tugas lapangan", "/tasks", "Tugas & laporan lapangan"],
    ["Uji prediksi (uji coba)", "/experiments/ml", "Uji prediksi muka air tanah"],
    ["Ringkasan", "/dashboard", "Ringkasan pemantauan"],
  ];
  for (const [label, path, title] of modules) {
    await page.locator("aside").getByRole("link", { name: label, exact: true }).click();
    await page.waitForURL(`${baseURL}${path}`);
    await page.getByRole("heading", { name: title, exact: true, level: 1 }).waitFor();
    assert.equal(await page.locator("aside").getByRole("link", { name: label, exact: true }).getAttribute("aria-current"), "page");
    assert.equal(await page.getByRole("button", { name: "Terkini", exact: true }).getAttribute("aria-pressed"), "true");
  }

  await page.getByRole("button", { name: "Ciutkan sidebar" }).click();
  await page.getByRole("button", { name: "Perluas sidebar" }).waitFor();
  await page.locator("aside").getByRole("link", { name: "Muka air tanah", exact: true }).click();
  await page.waitForURL("**/groundwater");
  await page.getByRole("button", { name: "Perluas sidebar" }).click();
  await page.getByRole("button", { name: "Riwayat", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Riwayat", exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("main").getByText("Data muka air terkini tidak tersedia", { exact: true }).count(), 0);

  for (const width of [768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const trigger = page.getByRole("button", { name: "Buka navigasi" });
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "Navigasi PeatSignal" });
    await drawer.waitFor();
    await page.keyboard.press("Tab");
    assert.equal(await drawer.evaluate((element) => element.contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "hidden" });
    assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);

    // Panduan tetap tersedia di header pada mobile.
    await helpButton.click();
    await guide.waitFor();
    await guide.getByRole("tab", { name: "Cara pakai" }).click();
    const tabList = await guide.getByRole("tablist").boundingBox();
    const lastTab = await guide.getByRole("tab", { name: "Penting" }).boundingBox();
    assert.ok(lastTab.x + lastTab.width <= tabList.x + tabList.width + 1, `Semua tab panduan terlihat pada ${width}px`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Panduan tidak overflow pada ${width}px`);
    await guide.getByRole("button", { name: "Tutup panduan" }).click();
    await guide.waitFor({ state: "hidden" });

    await trigger.click();
    await drawer.getByRole("link", { name: "Titik panas", exact: true }).click();
    await page.waitForURL("**/hotspots");
    await drawer.waitFor({ state: "hidden" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `Tidak boleh ada overflow horizontal pada ${width}px`);
  }

  await page.goto(`${baseURL}/alamat-tidak-ada`);
  await page.getByRole("heading", { name: "Halaman tidak ditemukan" }).waitFor();
  await page.getByRole("link", { name: "Kembali ke Ringkasan" }).click();
  await page.waitForURL("**/dashboard");
  assert.deepEqual(pageErrors, [], "Tidak boleh ada exception browser");
});
