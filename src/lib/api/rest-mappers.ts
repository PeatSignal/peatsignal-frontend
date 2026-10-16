import { areaIdForPoint, findArea } from "@/lib/domain/areas";
import { isoDateOf } from "@/lib/domain/dates";
import { formatDateRange } from "@/lib/format";
import { CURRENT_GWT_NOTICE, HISTORICAL_GWT_EMPTY_NOTICE } from "@/lib/domain/dashboard";
import { currentBounds } from "@/lib/domain/periods";
import type { AssessmentInput, GroundwaterObservation, GroundwaterSeries, Hotspot, HotspotCollection, PriorityAssessment, QualityFlag, Station } from "@/types";
import { RepositoryError } from "./errors";
import type { GroundwaterQuery, HotspotQuery, PriorityQuery } from "./repository";
import { apiPrioritySnapshotSchema, type ApiGroundwaterObservation, type ApiHotspot, type ApiHotspotPage, type ApiPriorityAssessment, type ApiStation } from "./rest-schemas";

// Pemetaan respons backend → model UI. Fungsi murni; payload sudah lolos rest-schemas.ts.

/** Konflik duplikat tetap dibedakan dari MISSING dan tidak pernah diubah menjadi angka. */
function toQualityFlag(flag: ApiGroundwaterObservation["quality_flag"]): QualityFlag {
  return flag === "DUPLICATE" ? "DUPLICATE_FLAGGED" : flag;
}

function modeMismatch(what: string): RepositoryError {
  return new RepositoryError("INVALID_PAYLOAD", `Data ${what} berisi mode yang tidak sesuai permintaan.`);
}

export function toStation(station: ApiStation): Station {
  return {
    id: station.id,
    code: station.code,
    region: station.region,
    lat: station.latitude,
    lon: station.longitude,
    coordinate_source: station.coordinate_source,
    period_start: station.period_start,
    period_end: station.period_end,
    source: station.source,
  };
}

function toGroundwaterObservation(row: ApiGroundwaterObservation): GroundwaterObservation {
  return {
    id: row.id,
    station_id: row.station_id,
    observed_at: row.observed_date,
    gwt_m: row.gwt_m,
    quality_flag: toQualityFlag(row.quality_flag),
    source: row.source,
    source_id: row.source_id,
    source_sha256: row.source_sha256,
    mode: row.mode,
  };
}

/** Backend mengirim array; UI memakai series dengan availability/notice dari query dan hasil. */
export function toGroundwaterSeries(query: GroundwaterQuery, rows: readonly ApiGroundwaterObservation[], today: string): GroundwaterSeries {
  if (rows.some((row) => row.mode !== query.mode || row.station_id !== query.station_id)) throw modeMismatch("GWT");
  let observations = rows.map(toGroundwaterObservation).sort((a, b) => a.observed_at.localeCompare(b.observed_at) || a.id.localeCompare(b.id));
  if (query.mode === "CURRENT_MONITORING") {
    // Guard: observasi lama tidak boleh tampil sebagai kondisi terkini.
    const minDate = currentBounds(today).min_date;
    observations = observations.filter((obs) => obs.observed_at >= minDate);
  }
  const base = { station_id: query.station_id, mode: query.mode, from: query.from, to: query.to };
  if (observations.length === 0) {
    const notice = query.mode === "CURRENT_MONITORING" ? CURRENT_GWT_NOTICE : HISTORICAL_GWT_EMPTY_NOTICE;
    return { ...base, availability: "NOT_AVAILABLE", notice, observations: [] };
  }
  // Gap tanggal dipertahankan; tidak ada baris buatan.
  return { ...base, availability: "AVAILABLE", notice: null, observations };
}

export function toHotspot(item: ApiHotspot): Hotspot {
  return {
    id: item.id,
    external_key: item.external_key,
    source_product: item.source_product,
    satellite: item.satellite,
    instrument: item.sensor,
    source: item.source,
    observed_at: item.acquired_at,
    quality_flag: toQualityFlag(item.quality_flag),
    mode: item.mode,
    latitude: item.latitude,
    longitude: item.longitude,
    frp_mw: item.frp,
    confidence_raw: item.confidence_raw,
    daynight: null,
    verification_status: item.verification_status,
    area_id: areaIdForPoint(item.longitude, item.latitude),
    imported_at: item.last_synced_at,
    is_simulation: false,
  };
}

export function toHotspotCollection(query: HotspotQuery, page: ApiHotspotPage): HotspotCollection {
  if (page.items.some((item) => item.mode !== query.mode)) throw modeMismatch("hotspot");
  const items = page.items.map(toHotspot);
  // Waktu import terbaru pada item halaman ini; API belum punya status sync global.
  const lastImport = items.reduce<string | null>((latest, item) => (item.imported_at && (!latest || Date.parse(item.imported_at) > Date.parse(latest)) ? item.imported_at : latest), null);
  return { mode: query.mode, items, total: page.total, limit: page.limit, offset: page.offset, last_synced_at: lastImport, last_synced_scope: "PAGE_IMPORT" };
}

/**
 * Cutoff priorities: akhir hari `as_of` (UTC), tetapi tidak pernah di masa depan karena backend
 * menolak timestamp masa depan (relevan untuk Mode terkini pada hari ini).
 */
export function priorityCutoff(asOfDate: string, nowMs: number): string {
  const endOfDay = `${asOfDate}T23:59:59Z`;
  if (Date.parse(endOfDay) <= nowMs) return endOfDay;
  return `${new Date(Math.floor(nowMs / 1000) * 1000).toISOString().slice(0, 19)}Z`;
}

const ENGINE_SOURCE = "Decision engine PeatSignal (server)";

/** Snapshot objek backend → indikator yang dapat dibaca pengguna; snapshot asli tetap disertakan. */
export function snapshotInputs(raw: Record<string, unknown>): AssessmentInput[] {
  const snapshot = apiPrioritySnapshotSchema.safeParse(raw);
  if (!snapshot.success) return [];
  const { window_start, window_end, hotspots, gwt_trends, supporting_reports, verification_reports } = snapshot.data;
  const inputs: AssessmentInput[] = [];
  if (window_start && window_end) {
    // Tanggal UTC; tanpa observed_at agar akhir hari UTC tidak tampil sebagai "besok" di WIB.
    inputs.push({ key: "WINDOW", label: "Jendela pengamatan (UTC)", value: formatDateRange(isoDateOf(window_start), isoDateOf(window_end)), unit: null, source: ENGINE_SOURCE, observed_at: null });
  }
  const latestHotspot = hotspots.map((item) => item.acquired_at).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? null;
  inputs.push({ key: "HOTSPOT_COUNT", label: "Anomali panas dalam jendela", value: hotspots.length, unit: "titik", source: "NASA FIRMS / VIIRS", observed_at: latestHotspot });
  if (hotspots.length > 0) {
    const days = new Set(hotspots.map((item) => isoDateOf(item.acquired_at))).size;
    inputs.push({ key: "HOTSPOT_DAYS", label: "Hari dengan anomali panas", value: days, unit: "hari", source: "NASA FIRMS / VIIRS", observed_at: latestHotspot });
    inputs.push({ key: "HOTSPOT_UNREVIEWED", label: "Belum diperiksa lapangan", value: hotspots.filter((item) => item.reviewed !== true).length, unit: "titik", source: "NASA FIRMS / VIIRS", observed_at: latestHotspot });
  }
  for (const trend of gwt_trends) {
    const last = trend.observations.at(-1)?.date ?? null;
    inputs.push({ key: `GWT_TREND_${trend.station}`, label: `Perubahan muka air tanah 7 hari · ${trend.station}`, value: trend.delta_m, unit: "m", source: "mmc1.xlsx (GWT harian)", observed_at: last });
  }
  inputs.push({ key: "FIELD_REPORTS", label: "Laporan lapangan terverifikasi", value: supporting_reports.length + verification_reports.length, unit: "laporan", source: "Tugas lapangan PeatSignal", observed_at: null });
  return inputs;
}

export function toPriorityAssessment(item: ApiPriorityAssessment, query: PriorityQuery): PriorityAssessment {
  if (item.mode !== query.mode) throw modeMismatch("prioritas");
  const area = findArea(item.area_id);
  return {
    id: item.id,
    mode: item.mode,
    as_of: isoDateOf(item.as_of),
    target: { type: "AREA", id: item.area_id, label: area?.label ?? item.area_id },
    area_id: item.area_id,
    priority: item.priority,
    decision: item.decision,
    reason_codes: item.reason_codes,
    explanation: item.explanation,
    missing_inputs: item.missing_inputs,
    input_snapshot: snapshotInputs(item.input_snapshot),
    recommended_actions: item.recommended_actions,
    rule_version: item.rule_version,
    scientific_status: item.scientific_status,
    source: ENGINE_SOURCE,
    // Backend tidak mengirim waktu evaluasi; cutoff informasi dipakai sebagai acuan waktu.
    created_at: item.as_of,
    is_simulation: false,
    raw_input_snapshot: item.input_snapshot,
  };
}
