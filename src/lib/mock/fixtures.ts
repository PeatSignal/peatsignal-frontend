import type { FieldReport, GroundwaterObservation, Hotspot, InspectionTask, MonitoringMode, Station, User } from "@/types";
import { ASSESSMENT_BLOCKS } from "@/lib/domain/areas";
import { addDays, daysBetween, parseIsoDate } from "@/lib/domain/dates";
import { createPrng, hashSeed, round } from "./prng";

// Seluruh nilai observasi pada file ini SINTETIS (DEMO). Hanya metadata stasiun
// (ID, wilayah, periode) yang mengikuti mmc1.xlsx; nilai GWT dan hotspot dibangkitkan.

export const DEMO_GWT_SOURCE = "DEMO sintetis · pola mengikuti metadata mmc1.xlsx (PMC8847808)";
export const DEMO_HOTSPOT_SOURCE = "DEMO sintetis · format NASA FIRMS VIIRS 375 m";
export const DEMO_RULE_SOURCE = "Mock decision engine (SIMULASI)";

/** Tanggal "hari ini" untuk Current Monitoring pada mode demo. Tetap agar demo deterministik. */
export const CURRENT_DEMO_DATE = "2026-10-12";
export const CURRENT_DEMO_LAST_SYNC = "2026-10-12T08:15:00Z";
export const HISTORICAL_DEMO_LAST_SYNC = null;

const STATION_SOURCE = "mmc1.xlsx sheet gwt (PMC8847808) — metadata stasiun";

const stationMeta: ReadonlyArray<readonly [id: string, region: string, from: string, to: string, base: number, depth: number]> = [
  ["BRG3", "Batanghari", "2018-04-08", "2019-08-27", -0.45, 0.55],
  ["BRG4", "Batanghari", "2018-04-08", "2018-12-28", -0.38, 0.45],
  ["BRG5", "Batanghari", "2018-04-11", "2019-12-31", -0.52, 0.6],
  ["BRG6", "Batanghari", "2018-04-11", "2019-10-07", -0.48, 0.65],
  ["BRG17", "Kubu Raya", "2018-04-12", "2019-07-16", -0.3, 0.4],
  ["BRG18", "Kubu Raya", "2018-04-12", "2018-12-31", -0.28, 0.35],
  ["BRG19", "Kubu Raya", "2018-04-12", "2019-12-31", -0.34, 0.45],
  ["BRG20", "Kubu Raya", "2018-04-13", "2019-12-31", -0.32, 0.42],
];

/**
 * Koordinat stasiun tidak tersedia pada sumber, sehingga tetap null dan tidak dipetakan.
 * ID mock memakai kode stasiun; pada REST ID berupa UUID dan label tetap dari `code`.
 */
export const STATIONS: readonly Station[] = stationMeta.map(([id, region, from, to]) => ({
  id, code: id, region, lat: null, lon: null, coordinate_source: null, period_start: from, period_end: to, source: STATION_SOURCE,
}));

export const USERS: readonly User[] = [
  { id: "u-coord-1", role: "coordinator", display_name: "Koordinator Demo" },
  { id: "u-field-1", role: "field_officer", display_name: "Petugas Lapangan A" },
  { id: "u-field-2", role: "field_officer", display_name: "Petugas Lapangan B" },
];

/** 0..1, puncak kemarau sekitar pertengahan September. */
function dryness(isoDate: string): number {
  const date = new Date(parseIsoDate(isoDate));
  const dayOfYear = daysBetween(`${date.getUTCFullYear()}-01-01`, isoDate);
  return Math.max(0, Math.sin((Math.PI * (dayOfYear - 175)) / 160));
}

function buildGroundwater(): Map<string, GroundwaterObservation[]> {
  const series = new Map<string, GroundwaterObservation[]>();
  for (const [id, , from, to, base, depth] of stationMeta) {
    const next = createPrng(hashSeed(`gwt:${id}`));
    const length = daysBetween(from, to) + 1;
    // Dua celah panjang per stasiun agar gap terlihat pada grafik.
    const gaps = [0, 1].map(() => {
      const start = Math.floor(next() * (length - 30));
      return [start, start + 4 + Math.floor(next() * 12)] as const;
    });
    let level = base;
    const observations: GroundwaterObservation[] = [];
    for (let day = 0; day < length; day += 1) {
      const date = addDays(from, day);
      const year2019 = date.startsWith("2019") ? 1.25 : 1;
      const target = base - depth * year2019 * dryness(date);
      level += (target - level) * 0.18 + (next() - 0.5) * 0.03;
      const missing = gaps.some(([start, end]) => day >= start && day <= end) || next() < 0.03;
      observations.push({
        id: `gwt-${id}-${date}`,
        station_id: id,
        observed_at: date,
        gwt_m: missing ? null : round(level, 3),
        quality_flag: missing ? "MISSING" : "VALID",
        source: DEMO_GWT_SOURCE,
        mode: "HISTORICAL_REPLAY",
      });
    }
    series.set(id, observations);
  }
  return series;
}

export const GROUNDWATER = buildGroundwater();

const blockIntensity: Record<string, number> = {
  "batanghari-a": 1,
  "batanghari-b": 0.45,
  "batanghari-c": 0.15,
  "kubu-raya-a": 0.2,
  "kubu-raya-b": 0.8,
  "kubu-raya-c": 0,
};

const satellites = [
  { code: "N", name: "Suomi NPP", product: "VIIRS_SNPP" },
  { code: "N20", name: "NOAA-20", product: "VIIRS_NOAA20" },
] as const;

function buildHotspots(mode: MonitoringMode, from: string, to: string, scale: number): Hotspot[] {
  const hotspots: Hotspot[] = [];
  const days = daysBetween(from, to) + 1;
  for (const block of ASSESSMENT_BLOCKS) {
    const intensity = (blockIntensity[block.id] ?? 0) * scale;
    if (intensity === 0) continue;
    const next = createPrng(hashSeed(`hotspot:${mode}:${block.id}`));
    const [minLon, minLat, maxLon, maxLat] = block.bbox;
    // Dua klaster per blok sehingga sebagian anomali muncul berulang di lokasi berdekatan.
    const clusters = [0.3, 0.7].map((share) => [minLon + (maxLon - minLon) * share, minLat + (maxLat - minLat) * (0.25 + next() * 0.5)] as const);
    for (let day = 0; day < days; day += 1) {
      const date = addDays(from, day);
      const count = Math.floor(next() * intensity * dryness(date) * 3.6 + next() * 0.65);
      for (let index = 0; index < count; index += 1) {
        const [centerLon, centerLat] = clusters[Math.floor(next() * clusters.length)] ?? clusters[0]!;
        const satellite = satellites[Math.floor(next() * satellites.length)] ?? satellites[0];
        const night = next() < 0.35;
        const hour = night ? 18 : 5 + Math.floor(next() * 2);
        const minute = Math.floor(next() * 60);
        const latitude = round(centerLat + (next() - 0.5) * 0.06, 5);
        const longitude = round(centerLon + (next() - 0.5) * 0.06, 5);
        const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        const confidenceRoll = next();
        hotspots.push({
          id: `hs-${mode === "HISTORICAL_REPLAY" ? "h" : "c"}-${block.id}-${date}-${index}`,
          external_key: `${satellite.product}:${latitude.toFixed(5)}:${longitude.toFixed(5)}:${date}T${time}Z`,
          source_product: `${satellite.product}_${mode === "HISTORICAL_REPLAY" ? "SP" : "NRT"}`,
          // Kode satelit seperti kolom `satellite` FIRMS/backend (N, N20), bukan nama.
          satellite: satellite.code,
          instrument: "VIIRS",
          observed_at: `${date}T${time}:00Z`,
          latitude,
          longitude,
          frp_mw: next() < 0.08 ? null : round(0.6 + next() ** 2 * 38, 2),
          confidence_raw: confidenceRoll < 0.2 ? "l" : confidenceRoll < 0.85 ? "n" : "h",
          daynight: night ? "N" : "D",
          verification_status: "UNVERIFIED",
          area_id: block.area_id,
          imported_at: null,
          source: DEMO_HOTSPOT_SOURCE,
          quality_flag: "VALID",
          mode,
          is_simulation: true,
        });
      }
    }
  }
  return hotspots.sort((a, b) => a.observed_at.localeCompare(b.observed_at) || a.id.localeCompare(b.id));
}

export const HISTORICAL_HOTSPOTS = buildHotspots("HISTORICAL_REPLAY", "2019-07-01", "2019-10-31", 1);
export const CURRENT_HOTSPOTS = buildHotspots("CURRENT_MONITORING", addDays(CURRENT_DEMO_DATE, -29), CURRENT_DEMO_DATE, 0.9);

function firstHotspot(blockId: string, from: string, to: string): Hotspot {
  const prefix = `hs-h-${blockId}-`;
  const hotspot = HISTORICAL_HOTSPOTS.find((item) => item.id.startsWith(prefix) && item.observed_at.slice(0, 10) >= from && item.observed_at.slice(0, 10) <= to);
  if (!hotspot) throw new Error(`Fixture hotspot untuk ${blockId} tidak ditemukan`);
  return hotspot;
}

export interface DemoStoreSeed {
  tasks: InspectionTask[];
  reports: FieldReport[];
}

/** Dua tugas SIMULASI agar alur petugas dan peninjauan dapat langsung didemokan. */
export function createSeedStore(): DemoStoreSeed {
  const assignedHotspot = firstHotspot("batanghari-a", "2019-09-12", "2019-09-15");
  const submittedHotspot = firstHotspot("kubu-raya-b", "2019-09-08", "2019-09-14");
  const tasks: InspectionTask[] = [
    {
      id: "task-1",
      mode: "HISTORICAL_REPLAY",
      title: "Periksa anomali panas Batanghari Blok A",
      status: "ASSIGNED",
      priority: "HIGH",
      assessment_id: null,
      hotspot_id: assignedHotspot.id,
      area_id: assignedHotspot.area_id,
      assignee_id: "u-field-1",
      created_by: "u-coord-1",
      created_at: "2026-10-13T01:00:00Z",
      updated_at: "2026-10-13T01:05:00Z",
      note: "Fokus pada klaster barat. Data SIMULASI.",
      history: [
        { from: null, to: "OPEN", actor_id: "u-coord-1", actor_role: "coordinator", at: "2026-10-13T01:00:00Z", note: null },
        { from: "OPEN", to: "ASSIGNED", actor_id: "u-coord-1", actor_role: "coordinator", at: "2026-10-13T01:05:00Z", note: null },
      ],
      is_simulation: true,
    },
    {
      id: "task-2",
      mode: "HISTORICAL_REPLAY",
      title: "Verifikasi anomali panas Kubu Raya Blok B",
      status: "SUBMITTED",
      priority: "MEDIUM",
      assessment_id: null,
      hotspot_id: submittedHotspot.id,
      area_id: submittedHotspot.area_id,
      assignee_id: "u-field-2",
      created_by: "u-coord-1",
      created_at: "2026-10-13T01:10:00Z",
      updated_at: "2026-10-13T04:30:00Z",
      note: null,
      history: [
        { from: null, to: "OPEN", actor_id: "u-coord-1", actor_role: "coordinator", at: "2026-10-13T01:10:00Z", note: null },
        { from: "OPEN", to: "ASSIGNED", actor_id: "u-coord-1", actor_role: "coordinator", at: "2026-10-13T01:12:00Z", note: null },
        { from: "ASSIGNED", to: "IN_PROGRESS", actor_id: "u-field-2", actor_role: "field_officer", at: "2026-10-13T02:00:00Z", note: null },
        { from: "IN_PROGRESS", to: "SUBMITTED", actor_id: "u-field-2", actor_role: "field_officer", at: "2026-10-13T04:30:00Z", note: "Laporan SIMULASI dikirim" },
      ],
      is_simulation: true,
    },
  ];
  const reports: FieldReport[] = [
    {
      id: "report-1",
      task_id: "task-2",
      observed_at: "2019-09-14T03:30:00Z",
      result: "BURN_SCAR_FOUND",
      note: "SIMULASI: bekas terbakar sekitar 0,5 ha di dekat kanal, tidak ada api aktif.",
      evidence_url: null,
      submitted_by: "u-field-2",
      submitted_at: "2026-10-13T04:30:00Z",
      is_simulation: true,
    },
  ];
  return { tasks, reports };
}
