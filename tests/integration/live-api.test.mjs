import { signIn } from "../shell/helpers.mjs";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright";
import { selectOption } from "../helpers/select.mjs";
import { pickDate } from "../helpers/calendar.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3100";
const apiURL = process.env.LIVE_API_BASE_URL ?? "http://127.0.0.1:8001/api/v1";
const decimal = (value, digits = 3) => {
  const text = new Intl.NumberFormat("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(value));
  return value < 0 ? `−${text}` : text;
};

test("live API: browser membaca data asli, metrics/forecast cocok artifact dan mode tetap terpisah", { timeout: 240_000 }, async (t) => {
  // DB-backed QA lifespan may still be opening its connection after uvicorn starts.
  const deadline = Date.now() + 30_000;
  while (true) {
    try {
      const ready = await fetch(new URL("/health", apiURL), { signal: AbortSignal.timeout(2000) });
      if (ready.ok) break;
    } catch { /* Wait only for startup, not for failing API assertions below. */ }
    if (Date.now() >= deadline) throw new Error("Backend QA belum siap setelah 30 detik");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(45_000);
  await page.addInitScript(() => localStorage.setItem("gambutops:guide-seen:v1", "1"));
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const apiFailures = [];
  page.on("requestfailed", (request) => {
    if (request.url().startsWith(apiURL) && !request.failure()?.errorText.includes("ERR_ABORTED")) apiFailures.push(request.failure()?.errorText);
  });
  page.on("response", (response) => {
    if (response.url().startsWith(apiURL) && response.status() >= 400) apiFailures.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });

  // Browser fetch exercises the real CORS policy; no Playwright route interception.
  await signIn(page, baseURL, "coordinator", "/experiments/ml");
  const main = page.locator("main");
  const health = await page.evaluate(async (url) => (await fetch(new URL("/health", url))).json(), apiURL);
  assert.equal(health.status, "ok");
  const metrics = await page.evaluate(async (url) => (await fetch(`${url}/ml/metrics`)).json(), apiURL);
  assert.equal(metrics.status, "AVAILABLE");
  assert.deepEqual(metrics.experiments.map((item) => item.station_code).sort(), ["BRG3", "BRG6"]);

  for (const experiment of metrics.experiments) {
    const artifact = JSON.parse(await readFile(new URL(`../fixtures/ml/${experiment.station_code.toLowerCase()}.metrics.json`, import.meta.url), "utf8"));
    assert.equal(experiment.model_version, artifact.model_version);
    assert.equal(experiment.model_metrics.mae_cm, artifact.mae_cm);
    assert.equal(experiment.model_metrics.rmse_cm, artifact.rmse_cm);
    await selectOption(main.getByLabel("Stasiun eksperimen"), experiment.station_id);
    await main.getByRole("heading", { name: `Evaluasi ${experiment.station_code}` }).waitFor();
    const experimentDetails = main.locator("details").filter({ has: page.locator("summary", { hasText: "Detail eksperimen" }) }).first();
    if ((await experimentDetails.getAttribute("open")) === null) await experimentDetails.locator("summary").first().click();
    await main.getByText(experiment.model_version, { exact: true }).waitFor();
    const metricsTable = main.getByRole("table").first();
    assert.ok((await metricsTable.innerText()).includes(decimal(artifact.mae_cm)));
    assert.ok((await metricsTable.innerText()).includes(decimal(artifact.baseline_mae_cm)));
    const first = artifact.predictions[0];
    const inputDate = new Date(`${first.date}T00:00:00Z`);
    inputDate.setUTCDate(inputDate.getUTCDate() - 1);
    await pickDate(page, "Tanggal input terakhir", inputDate.toISOString().slice(0, 10));
    const forecastResponse = page.waitForResponse((response) => response.url() === `${apiURL}/ml/forecast` && response.request().method() === "POST");
    await main.getByRole("button", { name: "Jalankan prediksi" }).click();
    const forecast = await (await forecastResponse).json();
    assert.equal(forecast.status, "OK");
    assert.equal(forecast.forecast_date, first.date);
    assert.equal(forecast.release_gate, artifact.release_gate);
    assert.ok(Math.abs(forecast.predicted_gwt_m - first.predicted_gwt_m) < 1e-9);
    assert.ok(Math.abs(forecast.baseline_gwt_m - first.baseline_gwt_m) < 1e-9);
    await main.getByText(`${decimal(forecast.predicted_gwt_m)} m`, { exact: true }).first().waitFor();
    await pickDate(page, "Tanggal input terakhir", "2026-10-15");
    await main.getByRole("button", { name: "Jalankan prediksi" }).click();
    await main.getByText(/Prediksi belum dapat dibuat:/).waitFor();
  }

  const screenshotDir = process.env.LIVE_SCREENSHOT_DIR;
  if (screenshotDir) {
    await mkdir(screenshotDir, { recursive: true });
    await page.screenshot({ path: `${screenshotDir}/ml-desktop.png`, fullPage: true });
  }
  await page.goto(`${baseURL}/groundwater?stasiun=BRG6`);
  await main.getByRole("button", { name: "Lihat sebagai tabel" }).click();
  const gwtTable = main.getByRole("region", { name: "Tabel muka air tanah BRG6" });
  await gwtTable.waitFor();
  const stations = await page.evaluate(async (url) => (await fetch(`${url}/stations`)).json(), apiURL);
  const station = stations.find((item) => item.code === "BRG6");
  const from = await page.getByRole("button", { name: "Periode", exact: true }).getAttribute("data-from");
  const to = await page.getByRole("button", { name: "Periode", exact: true }).getAttribute("data-to");
  const observations = await page.evaluate(async ({ url, id, from, to }) => (await fetch(`${url}/stations/${id}/groundwater?from=${from}&to=${to}&mode=HISTORICAL_REPLAY`)).json(), { url: apiURL, id: station.id, from, to });
  const observed = observations.find((item) => item.gwt_m !== null && item.quality_flag === "VALID");
  assert.ok(observed, "database memuat GWT valid pada periode awal");
  assert.ok((await gwtTable.innerText()).includes(`${decimal(observed.gwt_m)} m`));

  await page.goto(`${baseURL}/hotspots`);
  await main.getByRole("list", { name: "Daftar titik panas" }).waitFor();
  assert.equal(await main.getByRole("list", { name: "Daftar titik panas" }).locator(":scope > li").count(), 100);
  const next = page.getByRole("navigation", { name: "Halaman daftar titik" }).getByRole("button", { name: "Berikutnya" });
  await next.click();
  await main.getByText(/^Halaman 2 dari/).waitFor();
  await selectOption(page.getByRole("combobox", { name: "Wilayah", exact: true }), "batanghari");
  await main.getByText(/^Halaman 1 dari/).waitFor();

  await page.getByRole("button", { name: "Terkini", exact: true }).click();
  await main.getByRole("heading", { name: "Pembaruan data satelit (NASA FIRMS)" }).waitFor();
  await main.getByRole("button", { name: /^Sinkronkan / }).first().waitFor();
  await page.goto(`${baseURL}/groundwater?stasiun=BRG6`);
  // Monitoring mode is session state: use client navigation to preserve it below.
  await page.getByRole("button", { name: "Terkini", exact: true }).click();
  await main.getByText("Data muka air terkini tidak tersedia", { exact: true }).waitFor();
  await page.locator("aside").getByRole("link", { name: "Uji prediksi (uji coba)", exact: true }).click();
  await main.getByText(/Mode terkini ·/).waitFor();

  for (const route of ["dashboard", "groundwater", "hotspots", "priorities", "tasks", "experiments/ml"]) {
    await page.goto(`${baseURL}/${route}`);
    await main.getByRole("heading", { level: 1 }).waitFor();
    const ready = {
      dashboard: () => main.getByLabel("Angka ringkasan").getByRole("link").first(),
      groundwater: () => main.getByRole("button", { name: "Lihat sebagai tabel" }),
      hotspots: () => main.getByRole("list", { name: "Daftar titik panas" }),
      priorities: () => main.locator("article").first(),
      tasks: () => main.getByRole("group", { name: "Saring tugas" }),
      "experiments/ml": () => main.getByRole("heading", { name: /^Evaluasi / }),
    };
    await ready[route]().waitFor();
    await page.waitForFunction(() => document.querySelector('main [data-slot="skeleton"]') === null);
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} overflow ${width}`);
    }
    if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/${route.replaceAll("/", "-")}-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  assert.deepEqual(apiFailures, [], "API benar-benar terhubung tanpa kegagalan CORS/HTTP");
  assert.deepEqual(errors, [], "tanpa error JavaScript/hydration");
});
