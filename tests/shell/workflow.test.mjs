import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { pickDate } from "../helpers/calendar.mjs";
import { signIn, switchRole } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";

test("alur kerja: prioritas → tugas → petugas → laporan → tindak lanjut → verifikasi, bertahan setelah reload", { timeout: 180_000 }, async (t) => {
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

  // 1. Koordinator membuat tugas dari prioritas pertama.
  await signIn(page, baseURL, "coordinator", "/priorities");
  const firstCard = page.locator("main article").first();
  await firstCard.waitFor();
  await firstCard.getByRole("button", { name: /^Buat tugas/ }).click();
  const form = page.getByRole("dialog", { name: "Buat tugas pemeriksaan" });
  await form.waitFor();
  const title = `E2E periksa wilayah ${Date.now()}`;
  await form.getByLabel("Judul tugas").fill(title);
  const officerLabel = await form.getByRole("combobox", { name: /^Petugas/ }).innerText();
  assert.match(officerLabel, /petugas/i, "petugas pertama terpilih otomatis");
  await form.getByRole("button", { name: "Buat tugas" }).click();
  await form.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Buka tugas" }).click();
  await page.waitForURL(/\/tasks\?tugas=/);
  const taskUrl = page.url();

  const detail = page.locator('section[aria-labelledby="task-detail-title"]');
  const status = detail.locator('[data-slot="badge"]').first();
  await detail.getByRole("heading", { name: title }).waitFor();
  await assert.doesNotReject(status.filter({ hasText: "Ditugaskan" }).waitFor());

  // 2. Petugas memulai dan mengirim laporan SIMULASI.
  async function officerReports(resultLabel, note) {
    await switchRole(page, "field_officer");
    await detail.getByRole("button", { name: "Mulai kerjakan" }).click();
    await status.filter({ hasText: "Dikerjakan" }).waitFor();
    await detail.getByLabel(resultLabel).check();
    await detail.getByLabel("Apa yang Anda lihat?").fill(note);
    const observationDate = await detail.getByRole("button", { name: "Tanggal pengamatan", exact: true }).getAttribute("data-date");
    await pickDate(page, "Tanggal pengamatan", observationDate);
    const hours = detail.getByRole("spinbutton", { name: "Jam", exact: true });
    const validHours = await hours.inputValue();
    await hours.fill("99");
    await detail.getByRole("button", { name: "Kirim laporan SIMULASI" }).click();
    await detail.getByText("Waktu tidak valid", { exact: true }).waitFor();
    await hours.fill(validHours);
    await detail.getByRole("button", { name: "Kirim laporan SIMULASI" }).click();
    await status.filter({ hasText: "Menunggu tinjauan" }).waitFor();
  }
  await officerReports("Tidak ditemukan api", "Tidak ada asap di sekitar titik (uji E2E).");

  // 3. Reload: status dan laporan tetap ada.
  await page.reload();
  await detail.getByRole("heading", { name: title }).waitFor();
  await status.filter({ hasText: "Menunggu tinjauan" }).waitFor();
  await detail.getByText("Tidak ada asap di sekitar titik (uji E2E).").waitFor();

  // Petugas tidak bisa meninjau laporannya sendiri.
  assert.equal(await detail.getByRole("button", { name: "Verifikasi" }).count(), 0);

  // 4. Koordinator meminta tindak lanjut lalu menugaskan ulang.
  await switchRole(page, "coordinator");
  await detail.getByLabel("Catatan tinjauan (opsional)").fill("Mohon cek ulang sisi timur.");
  await detail.getByRole("button", { name: "Minta tindak lanjut" }).click();
  await status.filter({ hasText: "Perlu tindak lanjut" }).waitFor();
  await detail.getByRole("heading", { name: "Tugaskan untuk tindak lanjut" }).waitFor();
  await detail.getByRole("button", { name: "Tugaskan" }).click();
  await status.filter({ hasText: "Ditugaskan" }).waitFor();

  // 5. Kunjungan kedua, lalu koordinator memverifikasi.
  await officerReports("Bekas terbakar ditemukan", "Ditemukan bekas terbakar kecil (uji E2E).");
  await switchRole(page, "coordinator");
  await detail.getByRole("button", { name: "Verifikasi" }).click();
  await status.filter({ hasText: "Terverifikasi" }).waitFor();

  // 6. Reload di tab baru: riwayat lengkap dan dua laporan tersimpan.
  const fresh = await context.newPage();
  fresh.on("pageerror", (error) => errors.push(error.message));
  await fresh.goto(taskUrl);
  const freshDetail = fresh.locator('section[aria-labelledby="task-detail-title"]');
  await freshDetail.getByRole("heading", { name: title }).waitFor();
  await freshDetail.locator('[data-slot="badge"]').first().filter({ hasText: "Terverifikasi" }).waitFor();
  await freshDetail.getByRole("heading", { name: "Laporan lapangan (2)" }).waitFor();
  const history = await freshDetail.getByRole("heading", { name: "Riwayat status" }).locator("xpath=following-sibling::ol/li").count();
  // OPEN, ASSIGNED, IN_PROGRESS, SUBMITTED, NEEDS_FOLLOWUP, ASSIGNED, IN_PROGRESS, SUBMITTED, VERIFIED
  assert.equal(history, 9, "riwayat status mencatat seluruh perubahan");
  await freshDetail.getByText("“Mohon cek ulang sisi timur.”").waitFor();
  await freshDetail.getByRole("heading", { name: "Tugas selesai" }).waitFor();

  assert.deepEqual(errors, [], "tanpa error browser");
  await context.close();
});
