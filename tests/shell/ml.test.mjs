import { signIn } from "./helpers.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { selectOption } from "../helpers/select.mjs";
import { pickDate } from "../helpers/calendar.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";
const rest = process.env.ML_E2E_REST === "1";

test("ML: empty state atau REST metrics/forecast, pergantian stasiun, dan responsif", { timeout: 120_000 }, async (t) => {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => localStorage.setItem("gambutops:guide-seen:v1", "1"));
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let metricsStatus = "AVAILABLE";
  let forecastCalls = 0;
  if (rest) {
    const experiments = ["BRG6", "BRG3"].map((code, index) => ({
      station_id: `station-${index}`, station_code: code, model_version: `test-${code}`, model_type: "RandomForestRegressor",
      target: "GWT_T_PLUS_1_DAY", features: ["lag_1"], training_period: { from: "2018-01-01", to: "2019-01-01" },
      test_period: { from: "2019-07-19", to: "2019-07-20" }, test_size: 2,
      model_metrics: { mae_cm: 3, rmse_cm: 4 }, baseline_metrics: { mae_cm: 1, rmse_cm: 2 }, beats_baseline: false,
      predictions: [19, 20].map((day) => ({ date: `2019-07-${day}`, actual_m: -0.5, predicted_m: -0.53, baseline_m: -0.51 })),
      trained_at: "2026-10-15T00:00:00Z", is_simulation: false, release_gate: "EXPERIMENT_ONLY", limitations: ["Fixture pengujian, historis saja"],
    }));
    await page.route("**/api/v1/**", async (route) => {
      const url = new URL(route.request().url());
      let body = [];
      if (url.pathname.endsWith("/auth/me")) body = { id: "coordinator-fixture", role: "coordinator", display_name: "Koordinator Demo" };
      if (url.pathname.endsWith("/users")) body = [{ id: "coordinator-fixture", role: "coordinator", display_name: "Koordinator Demo" }];
      if (url.pathname.includes("/rainfall/")) {
        const end = url.searchParams.get("date_to");
        const dates = Array.from({ length: 7 }, (_, i) => { const day = new Date(`${end}T00:00:00Z`); day.setUTCDate(day.getUTCDate()+i-6); return day.toISOString().slice(0,10); });
        body = { status: "NOT_AVAILABLE", dataset_id: "UCSB-CHG/CHIRPS/DAILY", provider: "CLIMATESERV", scope: "REGIONAL_DEMO_BBOX", area_id: "batanghari", area_label: "Batanghari", bbox: [102.9,-2.2,104,-1.3], resolution_degrees: 0.05, statistic: "MEAN_VALID_CELLS", date_from: dates[0], date_to: end, retrieved_at: new Date().toISOString(), days: dates.map((date) => ({ date, rainfall_mm: null, valid_cells: null, source_url: "https://climateserv.servirglobal.net/api/" })), note: "Fixture hujan belum tersedia" };
      }
      if (url.pathname.endsWith("/ml/metrics")) {
        if (metricsStatus === "ERROR") return route.fulfill({ status: 503, json: { detail: "Server uji tidak tersedia" } });
        body = metricsStatus === "AVAILABLE" ? { status: "AVAILABLE", experiments } : { status: "NOT_AVAILABLE", reason: "Artifact pengujian belum tersedia" };
      }
      if (url.pathname.endsWith("/ml/forecast")) {
        forecastCalls++;
        const input = route.request().postDataJSON();
        body = input.date === "2026-10-15" ? { status: "REJECTED", reason: "Tujuh hari valid tidak tersedia" } : {
          status: "OK", station_id: input.station_id, input_date: input.date, forecast_date: "2019-07-19",
          predicted_gwt_m: -0.53, baseline_gwt_m: -0.51, model_version: "test-BRG6", release_gate: "EXPERIMENT_ONLY",
        };
      }
      await route.fulfill({ json: body });
    });
  }
  await signIn(page, baseURL, "coordinator", "/experiments/ml");
  const main = page.locator("main");
  await main.getByRole("heading", { name: "Uji prediksi muka air tanah", exact: true }).waitFor();
  await main.locator("summary").filter({ hasText: "Evaluasi model historis" }).click();
  if (!rest) {
    await main.getByRole("heading", { name: "Hasil eksperimen belum tersedia" }).waitFor();
    await main.getByRole("button", { name: "Periksa lagi" }).click();
    await main.getByRole("heading", { name: "Hasil eksperimen belum tersedia" }).waitFor();
    assert.equal(await main.getByRole("button", { name: "Jalankan prediksi" }).count(), 0);
  } else {
    await main.getByRole("heading", { name: "Evaluasi BRG6" }).waitFor();
    await main.getByText("Eksperimen saja", { exact: true }).waitFor();
    const details = main.locator("details").filter({ has: page.locator("summary", { hasText: "Detail eksperimen" }) }).last();
    assert.equal(await details.getAttribute("open"), null, "metode tersembunyi pada tampilan awal");
    await details.locator("summary").first().focus();
    await page.keyboard.press("Enter");
    await details.getByText("test-BRG6", { exact: true }).waitFor();
    await details.locator("summary").first().click();
    await main.getByRole("button", { name: "Jalankan prediksi" }).click();
    await main.getByText("Prediksi untuk 19 Jul 2019", { exact: true }).waitFor();
    await pickDate(page, "Tanggal input terakhir", "2026-10-15");
    assert.equal(await main.getByText("Prediksi untuk 19 Jul 2019", { exact: true }).count(), 0);
    await main.getByRole("button", { name: "Jalankan prediksi" }).click();
    await main.getByText(/Prediksi belum dapat dibuat: Tujuh hari/).waitFor();
    await selectOption(main.getByLabel("Stasiun eksperimen"), { label: "BRG3" });
    await main.getByRole("heading", { name: "Evaluasi BRG3" }).waitFor();
    assert.equal(await main.getByText(/Prediksi belum dapat dibuat:/).count(), 0);
    assert.equal(forecastCalls, 2);
    await main.getByText("Lihat nilai evaluasi dalam tabel").click();
    await main.getByRole("table").nth(1).waitFor();
  }
  if (process.env.UI_SCREENSHOT_DIR) {
    await mkdir(process.env.UI_SCREENSHOT_DIR, { recursive: true });
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    await page.screenshot({ path: `${process.env.UI_SCREENSHOT_DIR}/ml-rest-1440.png`, fullPage: true });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${process.env.UI_SCREENSHOT_DIR}/ml-rest-375.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Terkini", exact: true }).click();
  await main.getByText(/Mode terkini ·/).waitFor();
  for (const width of [1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `overflow pada ${width}px`);
  }
  if (rest) {
    metricsStatus = "ERROR";
    await page.reload();
    await main.locator("summary").filter({ hasText: "Evaluasi model historis" }).click();
    await main.getByRole("alert").waitFor();
    metricsStatus = "NOT_AVAILABLE";
    await main.getByRole("button", { name: "Coba lagi" }).click();
    await main.getByRole("heading", { name: "Hasil eksperimen belum tersedia" }).waitFor();
  }
  assert.deepEqual(errors, []);
});
