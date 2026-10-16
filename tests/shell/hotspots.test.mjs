import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { selectOption } from "../helpers/select.mjs";
import { signIn } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";

const rangeText = (text) => {
  const match = /Titik ([\d.]+)–([\d.]+) dari ([\d.]+)/.exec(text);
  return match ? match.slice(1).map((value) => Number(value.replaceAll(".", ""))) : null;
};

test("titik panas: daftar ↔ peta, detail, pagination, filter, tugas dari titik, dan status sinkron", { timeout: 180_000 }, async (t) => {
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

  await signIn(page, baseURL, "coordinator", "/hotspots");
  const main = page.locator("main");
  const list = page.getByRole("list", { name: "Daftar titik panas" });
  await list.getByRole("button").first().waitFor();
  const summary = main.getByText(/Titik [\d.]+–[\d.]+ dari [\d.]+/);
  const [from, to, total] = rangeText(await summary.innerText());
  assert.equal(from, 1);
  assert.ok(total >= to, "total dari server, bukan jumlah halaman");
  await main.getByText("Indikasi panas · perlu verifikasi", { exact: true }).waitFor();

  // Pilih dari daftar → detail + popup peta.
  await main.locator('[data-map-status="ready"]').waitFor({ timeout: 20_000 });
  await list.getByRole("button").first().click();
  const detail = page.getByRole("region", { name: /^Titik panas / });
  await detail.waitFor();
  await detail.getByText("Confidence (mentah)").waitFor();
  await detail.getByText(/UTC$/).waitFor();
  await page.locator(".maplibregl-popup").waitFor();
  assert.equal(await list.getByRole("button").first().getAttribute("aria-current"), "true");

  // Pilihan lain dari daftar memindahkan sorotan.
  const target = await list.getByRole("button").nth(2).getAttribute("data-hotspot-id");
  await list.getByRole("button").nth(2).click();
  assert.equal(await list.locator(`[data-hotspot-id="${target}"]`).getAttribute("aria-current"), "true");
  assert.equal(await page.locator(".maplibregl-popup").count(), 1, "hanya satu popup");

  // Coordinator membuat tugas langsung dari titik.
  await detail.getByRole("button", { name: "Buat tugas pemeriksaan" }).click();
  const form = page.getByRole("dialog", { name: "Buat tugas pemeriksaan" });
  await form.getByText(/Dari titik panas/).waitFor();
  await form.getByRole("button", { name: "Buat tugas" }).click();
  await form.waitFor({ state: "hidden" });
  await page.getByText("Tugas dibuat").waitFor();

  // Pagination dan reset ke halaman 1 saat filter berubah.
  if (total > to) {
    await main.getByRole("button", { name: "Berikutnya" }).click();
    await page.waitForFunction(() => /Titik 101–/.test(document.querySelector("main")?.textContent ?? ""));
    await page.getByRole("group", { name: "Saring satelit" }).getByRole("button", { name: "Suomi NPP", exact: true }).click();
    await page.waitForFunction(() => /Titik 1–/.test(document.querySelector("main")?.textContent ?? "") || /Tidak ada titik/.test(document.querySelector("main")?.textContent ?? ""));
    assert.equal(await page.getByRole("group", { name: "Saring satelit" }).getByRole("button", { name: "Suomi NPP", exact: true }).getAttribute("aria-pressed"), "true");
  }
  const area = page.getByRole("combobox", { name: "Wilayah", exact: true });
  await selectOption(area, { label: "Kubu Raya, Kalimantan Barat" });
  await page.getByRole("region", { name: /^Peta titik panas Kubu Raya/ }).waitFor();

  // Mode terkini menampilkan status sinkron FIRMS.
  await page.getByRole("button", { name: "Terkini", exact: true }).click();
  await page.getByRole("heading", { name: "Pembaruan data satelit (NASA FIRMS)" }).waitFor();

  // Layar HP: daftar diringkas, tanpa overflow.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("button", { name: "Riwayat", exact: true }).click();
  await list.getByRole("button").first().waitFor();
  assert.ok(await list.getByRole("button").count() <= 10, "daftar diringkas di HP");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);

  assert.deepEqual(errors, [], "tanpa error browser");
});
