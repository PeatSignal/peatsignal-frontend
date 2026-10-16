import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDailySeries, gapRuns, groundwaterChange, resolveStation, sortStations, stationCoverage, summarizeGroundwater,
} from "@/lib/domain/groundwater";
import { valueAxis } from "@/components/groundwater/chart-style";
import { describeDepth, formatDecimal, formatMeters } from "@/lib/format";
import type { GroundwaterObservation, QualityFlag } from "@/types";

const station = { period_start: "2019-08-01", period_end: "2019-08-27" };

function obs(date: string, gwt_m: number | null, quality_flag: QualityFlag = gwt_m === null ? "MISSING" : "VALID"): GroundwaterObservation {
  return { id: `o-${date}`, station_id: "s", observed_at: date, gwt_m, quality_flag, source: "x", mode: "HISTORICAL_REPLAY" };
}

test("deret harian: setiap hari ada, hari kosong bernilai null dan tidak pernah nol", () => {
  const days = buildDailySeries([obs("2019-08-20", -0.5), obs("2019-08-22", null), obs("2019-08-23", null, "DUPLICATE_FLAGGED")], "2019-08-20", "2019-08-29", station);
  assert.equal(days.length, 10);
  assert.deepEqual(days.map((day) => day.status), [
    "VALID", "NO_RECORD", "MISSING", "DUPLICATE", "NO_RECORD", "NO_RECORD", "NO_RECORD", "NO_RECORD", "OUTSIDE_STATION", "OUTSIDE_STATION",
  ]);
  assert.equal(days[0]?.value, -0.5);
  assert.ok(days.slice(1).every((day) => day.value === null), "hanya VALID yang bernilai");
});

test("deret harian: rentang terbalik atau tidak wajar menghasilkan array kosong", () => {
  assert.deepEqual(buildDailySeries([], "2019-08-20", "2019-08-19", station), []);
  assert.deepEqual(buildDailySeries([], "2000-01-01", "2019-12-31", station), []);
});

test("ringkasan: rata-rata, terdalam, terakhir hanya dari VALID; tanpa VALID → null", () => {
  const days = buildDailySeries([obs("2019-08-01", -0.2), obs("2019-08-02", -0.6), obs("2019-08-03", null), obs("2019-08-04", -0.4), obs("2019-08-05", null, "DUPLICATE_FLAGGED")], "2019-08-01", "2019-08-05", station);
  const summary = summarizeGroundwater(days);
  assert.deepEqual(summary.latest, { date: "2019-08-04", value: -0.4 });
  assert.deepEqual(summary.deepest, { date: "2019-08-02", value: -0.6 });
  assert.deepEqual(summary.shallowest, { date: "2019-08-01", value: -0.2 });
  assert.ok(Math.abs((summary.mean ?? 0) - -0.4) < 1e-9, "null dan duplikat tidak ikut dirata-rata");
  assert.deepEqual([summary.counts.VALID, summary.counts.MISSING, summary.counts.DUPLICATE, summary.totalDays], [3, 1, 1, 5]);

  const empty = summarizeGroundwater(buildDailySeries([obs("2019-08-01", null)], "2019-08-01", "2019-08-02", station));
  assert.deepEqual([empty.latest, empty.mean, empty.deepest], [null, null, null]);
});

test("perubahan 7 hari memakai pasangan valid berjarak 6–8 hari; tanpa pasangan → null", () => {
  const series = [obs("2019-08-01", -0.3), obs("2019-08-09", -0.45)];
  const drier = groundwaterChange(buildDailySeries(series, "2019-08-01", "2019-08-09", station), 7);
  assert.equal(drier?.direction, "DRIER");
  assert.equal(drier?.start.date, "2019-08-01");
  assert.ok(Math.abs((drier?.delta ?? 0) - -0.15) < 1e-9);

  const tooFar = [obs("2019-08-01", -0.3), obs("2019-08-11", -0.45)];
  assert.equal(groundwaterChange(buildDailySeries(tooFar, "2019-08-01", "2019-08-11", station), 7), null, "jarak 10 hari bukan 7 hari");

  const stable = [obs("2019-08-01", -0.3), obs("2019-08-08", -0.305)];
  assert.equal(groundwaterChange(buildDailySeries(stable, "2019-08-01", "2019-08-08", station), 7)?.direction, "STABLE");
  const wetter = [obs("2019-08-01", -0.5), obs("2019-08-15", -0.2)];
  assert.equal(groundwaterChange(buildDailySeries(wetter, "2019-08-01", "2019-08-15", station), 14)?.direction, "WETTER");
});

test("perubahan memakai titik VALID terakhir, bukan hari terakhir periode", () => {
  const series = [obs("2019-08-01", -0.3), obs("2019-08-08", -0.4), obs("2019-08-09", null)];
  const change = groundwaterChange(buildDailySeries(series, "2019-08-01", "2019-08-09", station), 7);
  assert.equal(change?.end.date, "2019-08-08");
});

test("gap run menggabungkan hari berurutan per jenis", () => {
  const days = buildDailySeries([obs("2019-08-20", -0.5), obs("2019-08-21", null), obs("2019-08-22", null), obs("2019-08-23", null, "DUPLICATE_FLAGGED"), obs("2019-08-24", -0.5)], "2019-08-20", "2019-08-29", station);
  assert.deepEqual(gapRuns(days).map((run) => [run.kind, run.start, run.end, run.days]), [
    ["NO_MEASUREMENT", "2019-08-21", "2019-08-22", 2],
    ["DUPLICATE", "2019-08-23", "2019-08-23", 1],
    ["NO_MEASUREMENT", "2019-08-25", "2019-08-27", 3],
    ["OUTSIDE_STATION", "2019-08-28", "2019-08-29", 2],
  ]);
});

test("cakupan stasiun mendeteksi periode yang melewati batas stasiun", () => {
  assert.deepEqual(stationCoverage(station, "2019-08-17", "2019-09-15"), { startsBefore: false, endsAfter: true, disjoint: false });
  assert.deepEqual(stationCoverage(station, "2019-11-01", "2019-11-03"), { startsBefore: false, endsAfter: true, disjoint: true });
  assert.equal(stationCoverage({ period_start: null, period_end: null }, "2019-08-01", "2019-08-02"), null);
});

test("urutan dan pemilihan stasiun: numerik per wilayah, URL → BRG6 → pertama", () => {
  const stations = [
    { code: "BRG17", region: "Kubu Raya" }, { code: "BRG6", region: "Batanghari" }, { code: "BRG3", region: "Batanghari" }, { code: "BRG9", region: null },
  ];
  assert.deepEqual(sortStations(stations).map((item) => item.code), ["BRG3", "BRG6", "BRG17", "BRG9"]);
  assert.equal(resolveStation(stations, stations, "brg3").station?.code, "BRG3");
  assert.equal(resolveStation(stations, stations, null).station?.code, "BRG6");
  const unknown = resolveStation(stations, stations, "BRG99");
  assert.deepEqual([unknown.station?.code, unknown.unknownCode], ["BRG6", "BRG99"]);
  const kubuRaya = stations.filter((item) => item.region === "Kubu Raya");
  assert.deepEqual([resolveStation(kubuRaya, stations, "BRG3").station?.code, resolveStation(kubuRaya, stations, "BRG3").unknownCode], ["BRG17", null], "stasiun di luar wilayah bukan kode tak dikenal");
});

test("format angka muka air memakai koma desimal, minus tipografis, dan penjelasan awam", () => {
  assert.equal(formatMeters(-0.854), "−0,85 m");
  assert.equal(formatMeters(0.004), "0,00 m");
  assert.equal(formatDecimal(-0.004), "0,00", "tidak menampilkan −0,00");
  assert.equal(describeDepth(-0.854), "85 cm di bawah permukaan");
  assert.equal(describeDepth(0.12), "12 cm di atas permukaan (tergenang)");
  assert.equal(describeDepth(-0.002), "Setara permukaan tanah");
});

test("sumbu-Y grafik: langkah rapi, selalu memuat permukaan 0 m dan acuan −0,4 m", () => {
  const deep = valueAxis([-1.27, -1.2, -1.05]);
  assert.deepEqual(deep.ticks, [-1.5, -1.25, -1, -0.75, -0.5, -0.25, 0, 0.25]);
  assert.equal(deep.digits, 2);
  const shallow = valueAxis([-0.1, 0.05]);
  assert.ok(shallow.domain[0] <= -0.4 && shallow.domain[1] >= 0.05);
  assert.ok(shallow.ticks.includes(0));
  assert.deepEqual(valueAxis([]).domain[1] >= 0, true, "tanpa data tetap ada sumbu");
});
