import assert from "node:assert/strict";
import test from "node:test";
import { CURRENT_HOTSPOTS, GROUNDWATER, HISTORICAL_HOTSPOTS, STATIONS, createSeedStore } from "@/lib/mock/fixtures";
import { createTaskInputSchema, fieldReportSchema, groundwaterObservationSchema, hotspotSchema, inspectionTaskSchema, stationSchema } from "@/lib/schemas";

test("stasiun dengan koordinat wajib mencantumkan sumber koordinat", () => {
  const base = { id: "BRG6", code: "BRG6", region: "Batanghari", lat: null, lon: null, coordinate_source: null, period_start: "2018-04-11", period_end: "2019-10-07", source: "x" };
  assert.equal(stationSchema.safeParse(base).success, true);
  assert.equal(stationSchema.safeParse({ ...base, lat: -1.5, lon: 103.5 }).success, false);
  assert.equal(stationSchema.safeParse({ ...base, lat: -1.5, lon: null, coordinate_source: "GPS" }).success, false);
  assert.equal(stationSchema.safeParse({ ...base, lat: -1.5, lon: 103.5, coordinate_source: "GPS survei" }).success, true);
});

test("GWT kosong harus null dengan flag MISSING, tidak boleh nol", () => {
  const obs = { id: "o", station_id: "BRG6", observed_at: "2019-09-01", gwt_m: null, quality_flag: "MISSING", source: "x", mode: "HISTORICAL_REPLAY" };
  assert.equal(groundwaterObservationSchema.safeParse(obs).success, true);
  assert.equal(groundwaterObservationSchema.safeParse({ ...obs, quality_flag: "VALID" }).success, false);
  assert.equal(groundwaterObservationSchema.safeParse({ ...obs, gwt_m: -0.5 }).success, false);
  // Konflik duplikat boleh tanpa nilai, tetapi tetap berflag berbeda dari MISSING.
  assert.equal(groundwaterObservationSchema.safeParse({ ...obs, quality_flag: "DUPLICATE_FLAGGED" }).success, true);
});

test("seluruh fixture valid terhadap schema dan berlabel DEMO/SIMULASI", () => {
  for (const station of STATIONS) {
    assert.equal(stationSchema.safeParse(station).success, true, station.id);
    assert.equal(station.lat, null, "koordinat stasiun tidak tersedia pada sumber");
  }
  assert.equal(STATIONS.length, 8);
  for (const series of GROUNDWATER.values()) {
    for (const obs of series) assert.equal(groundwaterObservationSchema.safeParse(obs).success, true, obs.id);
    assert.ok(series.some((obs) => obs.gwt_m === null), "fixture memuat gap");
    assert.ok(series.every((obs) => obs.gwt_m !== 0), "gap tidak menjadi nol");
  }
  for (const hotspot of [...HISTORICAL_HOTSPOTS, ...CURRENT_HOTSPOTS]) {
    assert.equal(hotspotSchema.safeParse(hotspot).success, true, hotspot.id);
    assert.equal(hotspot.is_simulation, true);
    assert.match(hotspot.source, /DEMO/);
  }
  const keys = new Set([...HISTORICAL_HOTSPOTS, ...CURRENT_HOTSPOTS].map((hotspot) => hotspot.external_key));
  assert.equal(keys.size, HISTORICAL_HOTSPOTS.length + CURRENT_HOTSPOTS.length, "external_key unik");
  const seed = createSeedStore();
  for (const task of seed.tasks) assert.equal(inspectionTaskSchema.safeParse(task).success, true, task.id);
  for (const report of seed.reports) assert.equal(fieldReportSchema.safeParse(report).success, true, report.id);
});

test("mode tidak bercampur pada fixture", () => {
  assert.ok(HISTORICAL_HOTSPOTS.every((hotspot) => hotspot.mode === "HISTORICAL_REPLAY" && hotspot.observed_at.startsWith("2019")));
  assert.ok(CURRENT_HOTSPOTS.every((hotspot) => hotspot.mode === "CURRENT_MONITORING" && hotspot.observed_at.startsWith("2026")));
});

test("input tugas wajib merujuk assessment atau hotspot", () => {
  const input = { mode: "HISTORICAL_REPLAY", title: "Periksa blok A", priority: "HIGH", assessment_id: null, hotspot_id: null, area_id: null, assignee_id: null, note: null };
  assert.equal(createTaskInputSchema.safeParse(input).success, false);
  assert.equal(createTaskInputSchema.safeParse({ ...input, hotspot_id: "hs-1" }).success, true);
  assert.equal(createTaskInputSchema.safeParse({ ...input, hotspot_id: "hs-1", title: "abc" }).success, false);
});
