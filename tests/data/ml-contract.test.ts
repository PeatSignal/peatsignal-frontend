import assert from "node:assert/strict";
import test from "node:test";
import { createRestRepository } from "@/lib/api/rest-repository";
import { RepositoryError } from "@/lib/api/errors";

// Fixture kontrak untuk pengujian; bukan hasil ilmiah atau data demo aplikasi.
const experiment = {
  station_id: "station-6", station_code: "BRG6", model_version: "test-v1", model_type: "RandomForestRegressor",
  target: "GWT_T_PLUS_1_DAY", features: ["lag_1"], training_period: { from: "2018-01-01", to: "2019-01-01" },
  test_period: { from: "2019-07-19", to: "2019-07-19" }, test_size: 1,
  model_metrics: { mae_cm: 3, rmse_cm: 4 }, baseline_metrics: { mae_cm: 1, rmse_cm: 2 },
  beats_baseline: false, predictions: [{ date: "2019-07-19", actual_m: -0.5, predicted_m: -0.53, baseline_m: -0.51 }],
  trained_at: "2026-10-15T00:00:00Z", is_simulation: false, release_gate: "EXPERIMENT_ONLY", limitations: ["Historis saja"],
};

test("ML REST mempertahankan kode stasiun, release gate dan batasan; gate hilang/asing ditolak", async () => {
  let payload: unknown = { status: "AVAILABLE", experiments: [experiment] };
  const repo = createRestRepository({ baseUrl: "http://api.test/api/v1", fetch: (async () => Response.json(payload)) as typeof fetch });
  const result = await repo.getMlMetrics();
  assert.equal(result.status, "AVAILABLE");
  if (result.status !== "AVAILABLE") return;
  assert.equal(result.experiments[0]?.station_code, "BRG6");
  assert.equal(result.experiments[0]?.release_gate, "EXPERIMENT_ONLY");
  assert.deepEqual(result.experiments[0]?.limitations, ["Historis saja"]);
  for (const gate of [undefined, "PRODUCTION_READY"]) {
    payload = { status: "AVAILABLE", experiments: [{ ...experiment, release_gate: gate }] };
    await assert.rejects(repo.getMlMetrics(), (error: unknown) => error instanceof RepositoryError && error.code === "INVALID_PAYLOAD");
  }
});

test("ML forecast mengirim tanggal input, mempertahankan gate dan meneruskan penolakan", async () => {
  let rejected = false;
  const repo = createRestRepository({ baseUrl: "http://api.test/api/v1", fetch: (async (url, init) => {
    assert.equal(new URL(String(url)).pathname, "/api/v1/ml/forecast");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { station_id: "station-6", date: "2019-07-18" });
    return Response.json(rejected ? { status: "REJECTED", reason: "Tujuh hari valid tidak tersedia" } : {
      status: "OK", station_id: "station-6", input_date: "2019-07-18", forecast_date: "2019-07-19",
      predicted_gwt_m: -0.53, baseline_gwt_m: -0.51, model_version: "test-v1", release_gate: "EXPERIMENT_ONLY",
    });
  }) as typeof fetch });
  const input = { station_id: "station-6", date: "2019-07-18" };
  const result = await repo.forecastGroundwater(input);
  assert.equal(result.status, "OK");
  if (result.status === "OK") assert.equal(result.release_gate, "EXPERIMENT_ONLY");
  rejected = true;
  assert.deepEqual(await repo.forecastGroundwater(input), { status: "REJECTED", reason: "Tujuh hari valid tidak tersedia" });
});
