import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { RepositoryError } from "@/lib/api/errors";
import { createRestRepository } from "@/lib/api/rest-repository";
import { CURRENT_GWT_NOTICE, HISTORICAL_GWT_EMPTY_NOTICE } from "@/lib/domain/dashboard";
import { groundwaterSeriesSchema, hotspotCollectionSchema, stationSchema } from "@/lib/schemas";

// Kontrak read API memakai snapshot respons nyata dari backend/docs/examples/read-api.json
// (lihat backend/docs/read-api-handoff.md).

interface Example { method: string; path: string; status: number; body: unknown }

const snapshot = JSON.parse(readFileSync(resolve(__dirname, "../fixtures/read-api.json"), "utf8")) as { examples: Record<string, Example> };
const examples = snapshot.examples;

function example(name: string): Example {
  const found = examples[name];
  assert.ok(found, `contoh ${name} ada pada snapshot`);
  return found;
}

const clone = <T,>(value: T): T => structuredClone(value);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Repository REST yang selalu menjawab dengan body/status yang diberikan. */
function serve(body: unknown, status = 200) {
  const calls: URL[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    calls.push(new URL(input instanceof Request ? input.url : input.toString()));
    return json(body, status);
  }) as typeof fetch;
  return { calls, repo: createRestRepository({ baseUrl: "http://localhost:8000/api/v1", fetch: fetchImpl, today: () => "2026-10-14" }) };
}

function serveExample(name: string) {
  const { body, status } = example(name);
  return serve(clone(body), status);
}

/** Request adapter harus memakai path dan query yang sama dengan contoh backend. */
function assertSameRequest(actual: URL | undefined, name: string) {
  assert.ok(actual, "request terkirim");
  const expected = new URL(example(name).path, "http://localhost:8000");
  assert.equal(actual.pathname, expected.pathname);
  for (const [key, value] of expected.searchParams) assert.equal(actual.searchParams.get(key), value, `query ${key}`);
}

async function rejectsWith(promise: Promise<unknown>, code: RepositoryError["code"], message?: RegExp) {
  await assert.rejects(promise, (error: unknown) => error instanceof RepositoryError && error.code === code && (!message || message.test(error.message)));
}

function stationId(code: string): string {
  const station = (example("stations").body as Array<{ id: string; code: string }>).find((item) => item.code === code);
  assert.ok(station, `stasiun ${code}`);
  return station.id;
}

test("stations: payload nyata lolos, UUID dipertahankan, code untuk label, koordinat null", async () => {
  const { repo, calls } = serveExample("stations");
  const stations = await repo.listStations();
  assertSameRequest(calls[0], "stations");
  assert.equal(stations.length, 8);
  for (const station of stations) {
    assert.equal(stationSchema.safeParse(station).success, true, station.code);
    assert.match(station.id, /^[0-9a-f-]{36}$/, "ID tetap UUID, bukan kode");
    assert.match(station.code, /^BRG\d+$/);
    assert.equal(station.lat, null);
    assert.equal(station.lon, null);
  }
  const brg3 = stations.find((station) => station.code === "BRG3");
  assert.equal(brg3?.id, stationId("BRG3"));
  assert.equal(brg3?.period_end, "2019-08-27", "batas periode BRG3 ditampilkan apa adanya");
});

for (const code of ["BRG6", "BRG3"] as const) {
  test(`groundwater ${code}: tanggal, nilai, source_id dan hash dipertahankan`, async () => {
    const name = `groundwater_${code.toLowerCase()}`;
    const raw = example(name).body as Array<{ observed_date: string; gwt_m: number | null; source_id: string; source_sha256: string }>;
    const { repo, calls } = serveExample(name);
    const query = { mode: "HISTORICAL_REPLAY" as const, station_id: stationId(code), from: "2019-08-17", to: "2019-08-19" };
    const series = await repo.getGroundwater(query);
    assertSameRequest(calls[0], name);
    assert.equal(groundwaterSeriesSchema.safeParse(series).success, true);
    assert.equal(series.availability, "AVAILABLE");
    assert.equal(series.notice, null);
    assert.deepEqual(
      series.observations.map((obs) => [obs.observed_at, obs.gwt_m, obs.source_id, obs.source_sha256]),
      raw.map((row) => [row.observed_date, row.gwt_m, row.source_id, row.source_sha256]),
    );
    assert.ok(series.observations.every((obs) => /^\d{4}-\d{2}-\d{2}$/.test(obs.observed_at)), "tanggal harian, tanpa jam");
  });
}

test("groundwater MISSING dan DUPLICATE: null dipertahankan dengan flag berbeda", async () => {
  const missing = serveExample("groundwater_missing");
  const missingSeries = await missing.repo.getGroundwater({ mode: "HISTORICAL_REPLAY", station_id: "2039bfb3-425b-4346-bbe0-26091c3428a3", from: "2019-03-01", to: "2019-03-01" });
  assertSameRequest(missing.calls[0], "groundwater_missing");
  assert.deepEqual(missingSeries.observations.map((obs) => [obs.gwt_m, obs.quality_flag]), [[null, "MISSING"]]);

  const duplicate = serveExample("groundwater_duplicate");
  const duplicateSeries = await duplicate.repo.getGroundwater({ mode: "HISTORICAL_REPLAY", station_id: "aac99b24-8a38-4bad-b19c-a0d8a253dafd", from: "2019-03-21", to: "2019-03-21" });
  assertSameRequest(duplicate.calls[0], "groundwater_duplicate");
  assert.deepEqual(duplicateSeries.observations.map((obs) => [obs.gwt_m, obs.quality_flag]), [[null, "DUPLICATE_FLAGGED"]]);
  assert.equal(duplicateSeries.availability, "AVAILABLE", "AVAILABLE berarti ada baris, bukan semua bernilai");
});

test("groundwater kosong → NOT_AVAILABLE dengan notice sesuai mode", async () => {
  const current = serveExample("groundwater_current_empty");
  const currentSeries = await current.repo.getGroundwater({ mode: "CURRENT_MONITORING", station_id: stationId("BRG6"), from: "2026-10-01", to: "2026-10-14" });
  assertSameRequest(current.calls[0], "groundwater_current_empty");
  assert.deepEqual([currentSeries.availability, currentSeries.notice, currentSeries.observations.length], ["NOT_AVAILABLE", CURRENT_GWT_NOTICE, 0]);

  const historical = serveExample("groundwater_historical_empty");
  const historicalSeries = await historical.repo.getGroundwater({ mode: "HISTORICAL_REPLAY", station_id: stationId("BRG6"), from: "2019-11-01", to: "2019-11-03" });
  assertSameRequest(historical.calls[0], "groundwater_historical_empty");
  assert.deepEqual([historicalSeries.availability, historicalSeries.notice, historicalSeries.observations.length], ["NOT_AVAILABLE", HISTORICAL_GWT_EMPTY_NOTICE, 0]);
});

test("hotspots halaman 1 dan 2: total sama, offset berbeda, ID tidak tumpang tindih, field dipetakan", async () => {
  const query = { mode: "HISTORICAL_REPLAY" as const, from: "2019-08-17", to: "2019-09-15", area_id: "batanghari", satellite: "N", source_product: "VIIRS_SNPP_HISTORICAL", limit: 2 };
  const one = serveExample("hotspots_page_1");
  const two = serveExample("hotspots_page_2");
  const page1 = await one.repo.listHotspots({ ...query, offset: 0 });
  const page2 = await two.repo.listHotspots({ ...query, offset: 2 });
  assertSameRequest(one.calls[0], "hotspots_page_1");
  assertSameRequest(two.calls[0], "hotspots_page_2");

  for (const page of [page1, page2]) assert.equal(hotspotCollectionSchema.safeParse(page).success, true);
  assert.equal(page1.total, page2.total);
  assert.ok(page1.total > page1.items.length, "total adalah seluruh hasil, bukan panjang halaman");
  assert.deepEqual([page1.offset, page2.offset], [0, 2]);
  const ids = [...page1.items, ...page2.items].map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);

  const raw = (example("hotspots_page_1").body as { items: Array<Record<string, unknown>> }).items[0]!;
  const item = page1.items[0]!;
  assert.equal(item.observed_at, raw.acquired_at);
  assert.equal(item.instrument, raw.sensor);
  assert.equal(item.frp_mw, raw.frp);
  assert.equal(item.imported_at, raw.last_synced_at);
  assert.equal(item.daynight, null, "daynight tidak ditebak");
  assert.equal(item.area_id, "batanghari", "lookup bbox DEMO");
  assert.equal(item.is_simulation, false);
  assert.equal(page1.mode, "HISTORICAL_REPLAY");
  assert.equal(page1.last_synced_scope, "PAGE_IMPORT");
  assert.equal(page1.last_synced_at, raw.last_synced_at);
});

test("hotspots kosong tetap kosong, tidak diganti fixture", async () => {
  const current = serveExample("hotspots_current_empty");
  const currentPage = await current.repo.listHotspots({ mode: "CURRENT_MONITORING", from: "2026-10-08", to: "2026-10-14" });
  assert.deepEqual([currentPage.items.length, currentPage.total, currentPage.last_synced_at], [0, 0, null]);

  const bbox = serveExample("hotspots_bbox_empty");
  const bboxPage = await bbox.repo.listHotspots({ mode: "HISTORICAL_REPLAY", from: "2019-08-17", to: "2019-09-15", bbox: [0, 0, 1, 1] });
  assert.equal(bbox.calls[0]?.searchParams.get("bbox"), "0,0,1,1");
  assert.deepEqual([bboxPage.items.length, bboxPage.total], [0, 0]);
});

test("422 dari backend → VALIDATION dengan pesan; stasiun tidak dikenal → NOT_FOUND", async () => {
  const query = { mode: "HISTORICAL_REPLAY" as const, from: "2019-08-17", to: "2019-09-15" };
  await rejectsWith(serveExample("invalid_bbox").repo.listHotspots({ ...query, bbox: [104, 0, 100, -3] }), "VALIDATION", /bbox longitude/);
  await rejectsWith(serveExample("invalid_date_range").repo.listHotspots({ ...query, from: "2019-09-15", to: "2019-08-17" }), "VALIDATION", /'from' must be on or before 'to'/);
  await rejectsWith(serveExample("invalid_station_uuid").repo.getGroundwater({ ...query, station_id: "BRG6" }), "VALIDATION", /valid UUID/);
  await rejectsWith(serve({ detail: "Station not found" }, 404).repo.getGroundwater({ ...query, station_id: "00000000-0000-0000-0000-000000000000" }), "NOT_FOUND", /Station not found/);
});

test("payload mode salah, tipe salah, atau field wajib hilang → INVALID_PAYLOAD", async () => {
  const query = { mode: "HISTORICAL_REPLAY" as const, from: "2019-08-17", to: "2019-09-15" };
  const page = () => clone(example("hotspots_page_1").body) as { items: Array<Record<string, unknown>>; total?: number };

  const wrongMode = page();
  wrongMode.items[0]!.mode = "CURRENT_MONITORING";
  await rejectsWith(serve(wrongMode).repo.listHotspots(query), "INVALID_PAYLOAD");

  const wrongType = page();
  wrongType.items[0]!.frp = "4.01";
  await rejectsWith(serve(wrongType).repo.listHotspots(query), "INVALID_PAYLOAD");

  const noTotal = page();
  delete noTotal.total;
  await rejectsWith(serve(noTotal).repo.listHotspots(query), "INVALID_PAYLOAD");

  const gwtQuery = { ...query, station_id: stationId("BRG6"), from: "2019-08-17", to: "2019-08-19" };
  const rows = () => clone(example("groundwater_brg6").body) as Array<Record<string, unknown>>;
  const gwtWrongMode = rows();
  gwtWrongMode[0]!.mode = "CURRENT_MONITORING";
  await rejectsWith(serve(gwtWrongMode).repo.getGroundwater(gwtQuery), "INVALID_PAYLOAD");
  const gwtMissingField = rows();
  delete gwtMissingField[0]!.source_sha256;
  await rejectsWith(serve(gwtMissingField).repo.getGroundwater(gwtQuery), "INVALID_PAYLOAD");
  const gwtWrongStation = rows();
  gwtWrongStation[0]!.station_id = stationId("BRG3");
  await rejectsWith(serve(gwtWrongStation).repo.getGroundwater(gwtQuery), "INVALID_PAYLOAD");

  const stations = clone(example("stations").body) as Array<Record<string, unknown>>;
  delete stations[0]!.code;
  await rejectsWith(serve(stations).repo.listStations(), "INVALID_PAYLOAD");
});

test("groundwater: baris diurutkan menurut tanggal dan gap tidak diisi", async () => {
  const rows = clone(example("groundwater_brg6").body) as Array<Record<string, unknown>>;
  const unordered = [rows[2]!, rows[0]!]; // 2019-08-19 lalu 2019-08-17; 2019-08-18 tidak ada
  const series = await serve(unordered).repo.getGroundwater({ mode: "HISTORICAL_REPLAY", station_id: stationId("BRG6"), from: "2019-08-17", to: "2019-08-19" });
  assert.deepEqual(series.observations.map((obs) => obs.observed_at), ["2019-08-17", "2019-08-19"], "tanpa baris buatan untuk 2019-08-18");
});
