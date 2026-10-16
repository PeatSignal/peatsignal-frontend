import type { GroundwaterObservation, Station } from "@/types";
import { addDays, daysBetween } from "./dates";

// Perhitungan halaman muka air tanah. Fungsi murni: tidak ada nilai yang dibuat untuk hari kosong.

/**
 * Status satu hari kalender pada periode tampilan.
 * - VALID: ada pengukuran bernilai.
 * - MISSING: sumber mencatat hari ini tetapi tanpa nilai (#N/A).
 * - DUPLICATE: dua catatan bertentangan pada tanggal yang sama; nilai tidak dipakai.
 * - SUSPECT: bernilai, tetapi ditandai perlu dicek; tidak dipakai untuk statistik.
 * - NO_RECORD: di dalam periode stasiun, tetapi tidak ada baris pada sumber.
 * - OUTSIDE_STATION: di luar periode pencatatan stasiun.
 */
export type GwtDayStatus = "VALID" | "MISSING" | "DUPLICATE" | "SUSPECT" | "NO_RECORD" | "OUTSIDE_STATION";

export const GWT_DAY_STATUSES: readonly GwtDayStatus[] = ["VALID", "MISSING", "DUPLICATE", "SUSPECT", "NO_RECORD", "OUTSIDE_STATION"];

export interface GwtDay {
  date: string;
  /** Hanya terisi untuk VALID; selain itu null agar garis grafik terputus. */
  value: number | null;
  status: GwtDayStatus;
  observation: GroundwaterObservation | null;
}

export interface GwtPoint {
  date: string;
  value: number;
}

/** Batas acuan regulasi (PP 57/2016): gambut budidaya dinyatakan rusak bila muka air lebih dalam dari 0,4 m. */
export const GWT_REFERENCE_M = -0.4;

/** Perubahan di bawah 1 cm dianggap relatif tetap. */
export const GWT_STABLE_THRESHOLD_M = 0.01;

/** Rentang tampilan maksimum; mencegah membangun deret kalender yang tidak wajar. */
const MAX_DAYS = 3660;

function statusOf(observation: GroundwaterObservation): GwtDayStatus {
  switch (observation.quality_flag) {
    case "VALID": return observation.gwt_m === null ? "MISSING" : "VALID";
    case "MISSING": return "MISSING";
    case "DUPLICATE_FLAGGED": return "DUPLICATE";
    case "SUSPECT": return "SUSPECT";
  }
}

function insideStationPeriod(date: string, station: Pick<Station, "period_start" | "period_end">): boolean {
  if (!station.period_start || !station.period_end) return false;
  return date >= station.period_start && date <= station.period_end;
}

/** Satu entri untuk setiap hari `from`..`to`. Hari tanpa pengukuran tetap ada dengan nilai null. */
export function buildDailySeries(observations: readonly GroundwaterObservation[], from: string, to: string, station: Pick<Station, "period_start" | "period_end">): GwtDay[] {
  const length = daysBetween(from, to) + 1;
  if (!(length > 0) || length > MAX_DAYS) return [];
  const byDate = new Map(observations.map((observation) => [observation.observed_at, observation]));
  const days: GwtDay[] = [];
  for (let index = 0; index < length; index += 1) {
    const date = addDays(from, index);
    const observation = byDate.get(date) ?? null;
    const status: GwtDayStatus = observation ? statusOf(observation) : insideStationPeriod(date, station) ? "NO_RECORD" : "OUTSIDE_STATION";
    days.push({ date, value: status === "VALID" ? observation?.gwt_m ?? null : null, status, observation });
  }
  return days;
}

export interface GwtSummary {
  latest: GwtPoint | null;
  mean: number | null;
  deepest: GwtPoint | null;
  shallowest: GwtPoint | null;
  counts: Record<GwtDayStatus, number>;
  totalDays: number;
}

function validPoints(days: readonly GwtDay[]): GwtPoint[] {
  return days.flatMap((day) => (day.status === "VALID" && day.value !== null ? [{ date: day.date, value: day.value }] : []));
}

/** Statistik hanya dari pengukuran VALID. Tanpa pengukuran → null, bukan nol. */
export function summarizeGroundwater(days: readonly GwtDay[]): GwtSummary {
  const counts = Object.fromEntries(GWT_DAY_STATUSES.map((status) => [status, 0])) as Record<GwtDayStatus, number>;
  for (const day of days) counts[day.status] += 1;
  const points = validPoints(days);
  if (points.length === 0) return { latest: null, mean: null, deepest: null, shallowest: null, counts, totalDays: days.length };
  // Pada nilai sama, tanggal paling akhir dipilih agar kondisi terbaru yang ditampilkan.
  const deepest = points.reduce((best, point) => (point.value <= best.value ? point : best));
  const shallowest = points.reduce((best, point) => (point.value >= best.value ? point : best));
  const mean = points.reduce((sum, point) => sum + point.value, 0) / points.length;
  return { latest: points.at(-1) ?? null, mean, deepest, shallowest, counts, totalDays: days.length };
}

export type GwtDirection = "DRIER" | "WETTER" | "STABLE";

export interface GwtChange {
  spanDays: number;
  start: GwtPoint;
  end: GwtPoint;
  /** end - start. Negatif = muka air turun (makin kering). */
  delta: number;
  direction: GwtDirection;
}

/**
 * Perubahan muka air dalam `spanDays` hari: pengukuran valid terakhir dibandingkan pengukuran valid
 * yang berjarak `spanDays` ± `toleranceDays` hari sebelumnya. Tidak ada pasangan → null.
 */
export function groundwaterChange(days: readonly GwtDay[], spanDays: number, toleranceDays = 1): GwtChange | null {
  const points = validPoints(days);
  const end = points.at(-1);
  if (!end) return null;
  let start: GwtPoint | null = null;
  let bestDistance = Infinity;
  for (const point of points) {
    const distance = Math.abs(daysBetween(point.date, end.date) - spanDays);
    if (distance <= toleranceDays && distance < bestDistance) {
      start = point;
      bestDistance = distance;
    }
  }
  if (!start) return null;
  const delta = end.value - start.value;
  const direction: GwtDirection = Math.abs(delta) < GWT_STABLE_THRESHOLD_M ? "STABLE" : delta < 0 ? "DRIER" : "WETTER";
  return { spanDays, start, end, delta, direction };
}

export type GwtGapKind = "NO_MEASUREMENT" | "DUPLICATE" | "OUTSIDE_STATION";

export interface GwtGapRun {
  kind: GwtGapKind;
  start: string;
  end: string;
  days: number;
}

function gapKind(status: GwtDayStatus): GwtGapKind | null {
  if (status === "MISSING" || status === "NO_RECORD" || status === "SUSPECT") return "NO_MEASUREMENT";
  if (status === "DUPLICATE") return "DUPLICATE";
  if (status === "OUTSIDE_STATION") return "OUTSIDE_STATION";
  return null;
}

/** Rentang hari berurutan tanpa nilai, dikelompokkan per jenis, untuk arsiran grafik. */
export function gapRuns(days: readonly GwtDay[]): GwtGapRun[] {
  const runs: GwtGapRun[] = [];
  for (const day of days) {
    const kind = gapKind(day.status);
    const last = runs.at(-1);
    if (kind && last && last.kind === kind && daysBetween(last.end, day.date) === 1) {
      last.end = day.date;
      last.days += 1;
    } else if (kind) {
      runs.push({ kind, start: day.date, end: day.date, days: 1 });
    }
  }
  return runs;
}

export interface StationCoverage {
  /** Periode tampilan dimulai sebelum stasiun mulai mencatat. */
  startsBefore: boolean;
  /** Periode tampilan berakhir setelah stasiun berhenti mencatat. */
  endsAfter: boolean;
  /** Periode tampilan sama sekali tidak beririsan dengan periode stasiun. */
  disjoint: boolean;
}

export function stationCoverage(station: Pick<Station, "period_start" | "period_end">, from: string, to: string): StationCoverage | null {
  if (!station.period_start || !station.period_end) return null;
  return {
    startsBefore: from < station.period_start,
    endsAfter: to > station.period_end,
    disjoint: to < station.period_start || from > station.period_end,
  };
}

function compareRegion(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b, "id");
}

/** Urutan stasiun: wilayah (tanpa wilayah di akhir), lalu kode secara numerik (BRG3 sebelum BRG17). */
export function sortStations<T extends Pick<Station, "code" | "region">>(stations: readonly T[]): T[] {
  return [...stations].sort((a, b) => compareRegion(a.region, b.region) || a.code.localeCompare(b.code, "id", { numeric: true }));
}

export const DEFAULT_STATION_CODE = "BRG6";

/**
 * Stasiun yang dipilih: kode dari URL bila ada pada daftar, lalu BRG6, lalu stasiun pertama.
 * `unknownCode` terisi bila URL meminta kode yang tidak dikenal sama sekali.
 */
export function resolveStation<T extends Pick<Station, "code">>(options: readonly T[], all: readonly T[], requestedCode: string | null): { station: T | null; unknownCode: string | null } {
  const wanted = requestedCode?.trim().toUpperCase() || null;
  const match = wanted ? options.find((station) => station.code.toUpperCase() === wanted) : undefined;
  const station = match ?? options.find((item) => item.code === DEFAULT_STATION_CODE) ?? options[0] ?? null;
  const unknownCode = wanted && !all.some((item) => item.code.toUpperCase() === wanted) ? requestedCode : null;
  return { station, unknownCode };
}
