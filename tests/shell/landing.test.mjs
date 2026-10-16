import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { signIn } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";

const SECTION_HEADINGS = [
  "Prevent, detection, action",
  /Data hari ini/,
  "Setiap langkah tercatat",
  "Prinsip penggunaan data",
  "Pertanyaan singkat",
  "Coba alurnya sekarang.",
];

const isVisible = (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  return style.visibility !== "hidden" && Number(style.opacity) > 0.5;
});

test("landing: isi, navigasi, animasi aman, tanpa JS, dan responsif", { timeout: 180_000 }, async (t) => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  await page.goto(baseURL);
  assert.equal(new URL(page.url()).pathname, "/", "beranda tidak redirect");
  assert.equal(await page.locator("html").getAttribute("lang"), "id");
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1, "tepat satu h1");
  const h1 = page.getByRole("heading", { level: 1 });
  assert.match((await h1.textContent()) ?? "", /Cegah kebakaran gambut\s*sebelum meluas\./);
  await page.waitForFunction(() => getComputedStyle(document.querySelector("h1 .split-parent")).visibility !== "hidden");
  for (const name of SECTION_HEADINGS) await page.getByRole("heading", { level: 2, name }).waitFor({ state: "attached" });
  await page.getByRole("heading", { level: 2, name: /Gambut bisa terbakar dari bawah tanah/ }).waitFor({ state: "attached" });

  // Ringkas: copy di main tetap ringkas setelah penambahan forecasting, tombol tanpa bayangan.
  // Label di dalam ilustrasi (.js-anim) bukan copy, jadi tidak dihitung.
  const copy = await page.locator("main").evaluate((main) => {
    const clone = main.cloneNode(true);
    clone.querySelectorAll(".js-anim").forEach((item) => item.remove());
    return clone.textContent ?? "";
  });
  const words = copy.split(/\s+/).filter(Boolean).length;
  assert.ok(words <= 500, `teks landing ringkas (${words} kata)`);
  const shadows = await page.locator("main a[data-slot=button], header a[data-slot=button]").evaluateAll((items) => items.map((item) => getComputedStyle(item).boxShadow));
  assert.ok(shadows.length > 0 && shadows.every((value) => value === "none" || /^(rgba\(0, 0, 0, 0\) 0px 0px 0px 0px,? ?)+$/.test(value)), `tombol tanpa bayangan: ${shadows.join(" | ")}`);

  // Forecasting menyatakan ilustrasi demo dan mengarahkan ke input baru.
  const mainText = await page.locator("main").innerText();
  assert.match(mainText, /DEMO/);
  assert.equal(await page.locator("#forecasting").getByRole("link", { name: "Coba Groundwater Forecasting" }).getAttribute("href"), "/login?next=%2Fexperiments%2Fml");
  assert.doesNotMatch(mainText, /JOINTS Hackathon/);
  assert.equal(await page.locator("main dl").count(), 0, "tanpa baris angka");
  // Hero dan panel cara kerja memakai ilustrasi SVG (bukan foto/screenshot).
  assert.equal(await page.locator("main img").count(), 0, "tanpa gambar raster");
  assert.match((await page.locator("main figure [role=img]").first().getAttribute("aria-label")) ?? "", /gambut/);
  assert.equal(await page.locator("#cara-kerja svg[role=img]").count(), 1, "grafik air tanah");
  // Peta titik panas MapLibre dimuat saat panel Deteksi mendekati layar.
  await page.locator("#langkah-deteksi").scrollIntoViewIfNeeded();
  await page.locator("#cara-kerja [data-map-status=ready]").waitFor({ timeout: 20_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => !document.querySelector("header > div")?.classList.contains("rounded-full"));
  // Alur: setiap langkah punya penjelasan singkat.
  const flow = await page.locator("#alur ol li").allInnerTexts();
  assert.equal(flow.length, 5);
  assert.ok(flow.every((item) => item.trim().split(/\n+/).length >= 2), "judul + penjelasan per langkah");

  // Tanpa shell aplikasi; panduan tidak terbuka.
  assert.equal(await page.getByRole("navigation", { name: "Navigasi utama" }).count(), 0);
  assert.equal(await page.getByRole("dialog").count(), 0);

  // Ilustrasi: label deskriptif.
  const labels = await page.locator("main [role=img]").evaluateAll((items) => items.map((svg) => svg.getAttribute("aria-label") ?? ""));
  assert.ok(labels.length === 4 && labels.every((label) => label.length > 20), "aria-label deskriptif");

  // Navbar menjadi pill setelah digulir; anchor menuju section.
  const bar = page.getByRole("banner").locator("> div");
  assert.equal(await bar.evaluate((element) => element.classList.contains("rounded-full")), false);
  await page.getByRole("navigation", { name: "Bagian halaman" }).getByRole("link", { name: "Cara kerja" }).click();
  await page.waitForFunction(() => location.hash === "#cara-kerja" || window.scrollY > 600);
  await page.waitForFunction(() => document.querySelector("header > div")?.classList.contains("rounded-full"));

  // FAQ bisa dibuka dengan keyboard.
  const faq = page.locator("#faq details").first();
  await faq.locator("summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(await faq.evaluate((element) => element.open), true);

  // CTA menuju login lalu aplikasi.
  await page.getByRole("banner").getByRole("link", { name: "Masuk" }).click();
  await page.waitForURL("**/login");
  await signIn(page, baseURL, "coordinator", "/dashboard");
  await page.waitForURL("**/dashboard");

  for (const width of [1024, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(baseURL);
    await h1.waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `tanpa overflow pada ${width}px`);
    await page.getByRole("banner").getByRole("link", { name: "Masuk" }).waitFor();
  }
  assert.deepEqual(errors, [], "tanpa error browser");

  // Reduced motion: isi langsung terlihat tanpa menunggu animasi.
  const reduced = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const calm = await reduced.newPage();
  await calm.goto(baseURL);
  await calm.waitForFunction(() => getComputedStyle(document.querySelector("h1 .split-parent")).visibility !== "hidden", null, { timeout: 5000 });
  await reduced.close();

  // Tanpa JavaScript: judul dan isi beranimasi tetap tampil.
  const noJs = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const plain = await noJs.newPage();
  await plain.goto(baseURL);
  assert.equal(await isVisible(plain.locator("h1 .split-parent").first()), true, "judul hero terlihat tanpa JS");
  assert.equal(await isVisible(plain.locator(".js-reveal").nth(3)), true, "isi beranimasi terlihat tanpa JS");
  await plain.getByRole("link", { name: "Masuk ke aplikasi" }).first().waitFor();
  await noJs.close();
});
