import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { chooseAccount, signOut } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";

test("login: wajib masuk, kembali ke tujuan, next aman, sesi bertahan, keluar", { timeout: 120_000 }, async (t) => {
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

  // Semua halaman aplikasi dijaga; tujuan (termasuk query) dibawa ke login.
  for (const path of ["/dashboard", "/groundwater", "/hotspots", "/priorities", "/tasks?tugas=task-2", "/experiments/ml"]) {
    await page.goto(`${baseURL}${path}`);
    await page.waitForURL((url) => url.pathname === "/login" && url.searchParams.get("next") === path);
  }
  await page.getByRole("heading", { name: "Masuk ke PeatSignal", level: 1 }).waitFor();
  assert.equal(await page.getByRole("navigation", { name: "Navigasi utama" }).count(), 0, "login tanpa shell aplikasi");

  // Masuk sebagai petugas → kembali ke halaman tujuan terakhir.
  await chooseAccount(page, "field_officer");
  await page.waitForURL((url) => url.pathname === "/experiments/ml");
  await page.getByRole("button", { name: /^Buka profil \(Petugas/ }).waitFor();

  assert.equal(await page.getByRole("button", { name: /^Keluar/ }).count(), 0, "logout tersembunyi sebelum profil dibuka");
  const profile = page.getByRole("button", { name: /^Buka profil/ });
  await profile.click();
  await page.getByRole("button", { name: /^Keluar \(Petugas/ }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Keluar/ }).waitFor({ state: "hidden" });
  assert.equal(await profile.evaluate((element) => element === document.activeElement), true, "fokus kembali ke profil");

  // Sesi bertahan setelah reload; membuka /login saat sudah masuk langsung diteruskan.
  await page.reload();
  await page.getByRole("button", { name: /^Buka profil \(Petugas/ }).waitFor();
  await page.goto(`${baseURL}/login?next=/tasks`);
  await page.waitForURL((url) => url.pathname === "/tasks");

  // Keluar → login dengan tujuan halaman saat ini; halaman aplikasi kembali terkunci.
  await signOut(page);
  assert.equal(new URL(page.url()).searchParams.get("next"), "/tasks");
  await page.goto(`${baseURL}/dashboard`);
  await page.waitForURL((url) => url.pathname === "/login");

  // `next` ke situs lain diabaikan.
  for (const evil of ["//evil.example", "https://evil.example", "/\\evil.example"]) {
    await page.goto(`${baseURL}/login?next=${encodeURIComponent(evil)}`);
    await chooseAccount(page, "coordinator");
    await page.waitForURL((url) => url.origin === new URL(baseURL).origin && url.pathname === "/dashboard");
    await signOut(page);
  }

  // Sesi rusak dianggap belum masuk.
  await page.evaluate(() => localStorage.setItem("gambutops:session:v1", "{rusak"));
  await page.goto(`${baseURL}/dashboard`);
  await page.waitForURL((url) => url.pathname === "/login");

  // HP: form login tanpa overflow.
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole("button", { name: /^Masuk sebagai / }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);

  assert.deepEqual(errors, [], "tanpa error browser");
});
