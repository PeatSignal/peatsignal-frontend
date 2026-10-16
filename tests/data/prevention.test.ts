import assert from "node:assert/strict";
import test from "node:test";
import { addDays } from "../../src/lib/domain/dates";
import { preventionInputSchema, preventionResponseSchema } from "../../src/lib/schemas/prevention";
import { createMockRepository } from "../../src/lib/mock/mock-repository";
import { createRestRepository } from "../../src/lib/api/rest-repository";
import { createMemoryStorage } from "../../src/lib/mock/storage";
import type { PreventionInput } from "../../src/types";

const today = new Date().toISOString().slice(0, 10);
function input(rain: number | null = 0): PreventionInput {
  return { station_code: "BRG6", source_kind: "DEMO", source_note: "Fixture pengujian", readings: [-0.32, -0.35, -0.39, -0.42, -0.45, -0.48, -0.52].map((gwt_m, i) => ({ date: addDays(today, i - 6), gwt_m, rainfall_mm: rain })) };
}

test("penilaian: hujan hilang tidak menjadi nol; mock tidak mengarang ML", async () => {
  const repo = createMockRepository({ storage: createMemoryStorage(), latencyMs: 0 });
  const absent = await repo.assessPrevention(input(null));
  const dry = await repo.assessPrevention(input(0));
  preventionResponseSchema.parse(dry);
  assert.equal(absent.prevention.rainfall_7d_mm, null);
  assert.equal(absent.prevention.dry_spell_days, null);
  assert.equal(dry.prevention.rainfall_7d_mm, 0);
  assert.equal(dry.prevention.dry_spell_days, 7);
  assert.equal(dry.prevention.priority, "HIGH");
  assert.equal(dry.forecast.model_gwt_m, null);
  assert.equal(dry.forecast.model_mae_cm, null);
  assert.equal(dry.prevention.forecast_used, false);
  assert.equal(dry.is_simulation, true);
});

test("penilaian: input basi tidak menghasilkan prediksi terkini", async () => {
  const repo = createMockRepository({ storage: createMemoryStorage(), latencyMs: 0 });
  const stale = input(); stale.readings.forEach((row) => row.date = addDays(row.date, -3));
  const result = await repo.assessPrevention(stale);
  assert.equal(result.freshness, "STALE");
  assert.equal(result.forecast.selected_gwt_m, null);
  assert.equal(result.prevention.priority, "INSUFFICIENT_DATA");
});

test("penilaian: tanggal duplikat/masa depan, NaN, dan hujan negatif ditolak", () => {
  const duplicate = input(); duplicate.readings[0]!.date = duplicate.readings[1]!.date;
  assert.equal(preventionInputSchema.safeParse(duplicate).success, false);
  const future = input(); future.readings.forEach((row) => row.date = addDays(row.date, 1));
  assert.equal(preventionInputSchema.safeParse(future).success, false);
  const nan = input(); nan.readings[0]!.gwt_m = NaN;
  assert.equal(preventionInputSchema.safeParse(nan).success, false);
  assert.equal(preventionInputSchema.safeParse(input(-1)).success, false);
});

test("penilaian REST: provenance, satuan dan tujuh tanggal dikirim tanpa perubahan", async () => {
  const mock = createMockRepository({ storage: createMemoryStorage(), latencyMs: 0 });
  const payload = { ...input(), source_kind: "MANUAL" as const };
  const expected = await mock.assessPrevention(payload);
  let calls = 0;
  const repo = createRestRepository({ baseUrl: "http://test/api/v1", fetch: async (url, init) => {
    calls++;
    assert.equal(String(url), "http://test/api/v1/prevention/assess");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(init!.body as string), payload);
    return new Response(JSON.stringify(expected), { status: 200, headers: { "Content-Type": "application/json" } });
  } });
  const response = await repo.assessPrevention(payload);
  assert.equal(response.is_simulation, false);
  assert.equal(response.observation_status, "USER_PROVIDED_UNVERIFIED");
  assert.equal(calls, 1);
});


test("CHIRPS mock: input browser tidak dapat menyamar sebagai hujan otomatis", async () => {
  const repo = createMockRepository({ storage: createMemoryStorage(), latencyMs: 0 });
  const result = await repo.assessPrevention({ ...input(0), rainfall_mode: "CHIRPS" });
  assert.equal(result.rainfall?.status, "NOT_AVAILABLE");
  assert.equal(result.prevention.rainfall_7d_mm, null);
  assert.equal(result.prevention.dry_spell_days, null);
  assert.ok(result.readings?.every((row) => row.rainfall_mm === null));
});
