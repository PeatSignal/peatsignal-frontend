import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { selectOption } from "../helpers/select.mjs";
import { pickRange } from "../helpers/calendar.mjs";
import { signIn } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";

test("groundwater: stasiun, periode, gap, tooltip, tabel, mode terkini, dan responsivitas", { timeout: 120_000 }, async (t) => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") pageErrors.push(message.text()); });

  await signIn(page, baseURL, "coordinator", "/groundwater");

  const main = page.locator("main");
  const picker = page.getByLabel("Stasiun pengukuran");
  await page.getByRole("heading", { name: "Grafik muka air tanah harian" }).waitFor();
  assert.equal(await picker.getAttribute("data-value"), "BRG6", "default BRG6");
  assert.equal(await main.getByRole("button", { name: "30 hari" }).getAttribute("aria-pressed"), "true", "periode default 30 hari");
  await main.getByText("Pengukuran terakhir", { exact: true }).waitFor();
  assert.match(await main.locator("dl").innerText(), /−\d,\d{2} m/, "nilai memakai koma dan minus tipografis");
  assert.equal(await main.getByText("Batas acuan regulasi −0,4 m (PP 57/2016)", { exact: false }).count(), 1, "legenda garis acuan beserta sumber");

  // BRG3 berhenti 27 Agu 2019: periode default melewati masa pencatatan → diberi keterangan, bukan diisi nilai.
  await selectOption(picker, "BRG3");
  await page.waitForURL("**/groundwater?stasiun=BRG3");
  await main.getByText("BRG3 berhenti mencatat pada 27 Agu 2019.", { exact: false }).waitFor();
  await main.getByText("Di luar periode pencatatan stasiun").waitFor();
  await main.getByText("Belum ada pengukuran sesudahnya").waitFor();

  // Tooltip pada hari terukur dan pada hari di luar periode stasiun.
  const surface = main.locator(".recharts-surface").first();
  await surface.scrollIntoViewIfNeeded();
  const box = await surface.boundingBox();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.6, { steps: 4 });
  const tooltip = main.locator(".recharts-tooltip-wrapper");
  await tooltip.getByText("cm di bawah permukaan", { exact: false }).waitFor();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.6, { steps: 4 });
  await tooltip.getByText("Di luar periode stasiun").waitFor();
  assert.equal(await tooltip.evaluate((element) => getComputedStyle(element).visibility), "visible", "tooltip hari tanpa nilai tetap terlihat");

  // Tabel alternatif: hari tanpa nilai tetap tertulis, tidak menjadi nol.
  await main.getByRole("button", { name: "Lihat sebagai tabel" }).click();
  const table = main.getByRole("region", { name: "Tabel muka air tanah BRG3" });
  await table.waitFor();
  assert.equal(await table.locator("tbody tr").count(), 30);
  assert.equal(await table.getByText("0,000 m").count(), 0, "gap tidak menjadi nol");
  assert.ok(await table.getByText("Di luar periode stasiun").count() > 0);
  await main.getByRole("button", { name: "Sembunyikan tabel" }).click();

  // Pintasan "Seluruh data stasiun" memperbarui periode global; panel mengikuti.
  await main.getByRole("button", { name: "Seluruh data stasiun" }).click();
  await main.getByText("Periode: 8 Apr 2018 – 27 Agu 2019", { exact: false }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Periode", exact: true }).getAttribute("data-to"), "2019-08-27");
  assert.equal(await main.getByText("Sebagian periode di luar masa pencatatan stasiun").count(), 0);
  await main.getByText("Tidak ada pengukuran:", { exact: false }).waitFor();

  // Periode di luar masa stasiun → keadaan kosong dengan tombol perbaikan.
  await pickRange(page, "2019-11-01", "2019-11-20");
  await main.getByRole("heading", { name: "Tidak ada pengukuran BRG3 pada periode ini" }).waitFor();
  await main.getByRole("button", { name: "Tampilkan seluruh periode stasiun" }).click();
  await page.getByRole("heading", { name: "Grafik muka air tanah harian" }).waitFor();

  // Filter wilayah menyaring stasiun; stasiun di luar wilayah diganti stasiun pertama wilayah itu.
  await selectOption(page.getByLabel("Wilayah"), { label: "Kubu Raya, Kalimantan Barat" });
  await main.getByText("Daftar stasiun disaring untuk wilayah Kubu Raya.").waitFor();
  assert.equal(await picker.getAttribute("data-value"), "BRG17");
  await page.getByRole("button", { name: "Reset" }).click();

  // Kode tak dikenal di URL → kembali ke BRG6 dengan keterangan.
  await page.goto(`${baseURL}/groundwater?stasiun=XYZ`);
  await main.getByText("Stasiun “XYZ” tidak ditemukan. Menampilkan BRG6.").waitFor();

  // Mode terkini: tidak ada grafik; tombol kembali ke riwayat.
  await page.getByRole("button", { name: "Terkini", exact: true }).click();
  await main.getByRole("heading", { name: "Data muka air terkini belum tersedia" }).waitFor();
  assert.equal(await main.getByRole("heading", { name: "Grafik muka air tanah harian" }).count(), 0);
  await main.getByRole("button", { name: "Lihat data riwayat 2018–2019" }).click();
  await page.getByRole("heading", { name: "Grafik muka air tanah harian" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Riwayat", exact: true }).getAttribute("aria-pressed"), "true");

  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Tidak boleh ada overflow horizontal pada ${width}px`);
  }
  // Tautan "Ubah tanggal" membawa ke panel pengaturan (di bawah konten pada layar kecil).
  await main.getByRole("link", { name: "Ubah tanggal" }).click();
  await page.waitForURL("**#pengaturan-data");

  assert.deepEqual(pageErrors, [], "Tidak boleh ada exception/error console");
});
