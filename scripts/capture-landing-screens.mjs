// Ambil screenshot aplikasi (data contoh DEMO) untuk landing page.
// Pakai build mock: `npm run build && npm run start`, lalu di terminal lain:
//   node scripts/capture-landing-screens.mjs [baseURL]
// Hasil: public/landing/*.jpg. Jalankan ulang bila tampilan aplikasi berubah.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseURL = process.argv[2] ?? "http://127.0.0.1:3000";
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "landing");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1.5 });
await context.addInitScript(() => localStorage.setItem("gambutops:guide-seen:v1", "1"));
const page = await context.newPage();
const shot = (name, locator) => locator.screenshot({ path: join(out, `${name}.jpg`), type: "jpeg", quality: 82 });
const settle = (ms = 1500) => page.waitForTimeout(ms);

// Muka air tanah: kartu grafik.
await page.goto(`${baseURL}/groundwater`);
await page.getByRole("heading", { name: "Grafik muka air tanah harian" }).waitFor();
await settle();
await shot("groundwater", page.getByRole("heading", { name: "Grafik muka air tanah harian" }).locator("xpath=ancestor::*[contains(@class,'rounded-xl')][1]"));

// Titik panas: peta + detail titik terpilih.
await page.goto(`${baseURL}/hotspots`);
await page.locator('main [data-map-status="ready"]').waitFor({ timeout: 30_000 });
await page.getByRole("list", { name: "Daftar titik panas" }).getByRole("button").nth(3).click();
await settle(2500);
await shot("hotspots", page.locator("main [data-map-status]"));

// Prioritas: kartu wilayah pertama.
await page.goto(`${baseURL}/priorities`);
await page.locator("main article").first().waitFor();
await settle();
await shot("priorities", page.locator("main article").first());

// Tugas: detail laporan yang menunggu tinjauan koordinator.
await page.goto(`${baseURL}/tasks?tugas=task-2`);
await page.getByRole("heading", { name: "Riwayat status" }).waitFor();
await settle();
await shot("tasks", page.locator('section[aria-labelledby="task-detail-title"]'));

await browser.close();
console.log(`Screenshot tersimpan di ${out}`);
