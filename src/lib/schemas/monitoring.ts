import { z } from "zod";
import { isoDateSchema, isoDateTimeSchema, monitoringModeSchema, provenanceShape } from "./common";

export const stationSchema = z
  .object({
    /** ID opaque (UUID pada REST). Jangan ditampilkan; gunakan `code` sebagai label. */
    id: z.string().min(1),
    /** Kode stasiun pada sumber, misalnya BRG6. */
    code: z.string().min(1),
    region: z.string().min(1).nullable(),
    lat: z.number().min(-90).max(90).nullable(),
    lon: z.number().min(-180).max(180).nullable(),
    coordinate_source: z.string().min(1).nullable(),
    /** Min/max tanggal observasi stasiun, termasuk baris missing/duplikat. */
    period_start: isoDateSchema.nullable(),
    period_end: isoDateSchema.nullable(),
    source: z.string().min(1).nullable(),
  })
  // Koordinat tanpa sumber tidak boleh dipakai sebagai pin peta.
  .refine((station) => (station.lat === null) === (station.lon === null), "lat dan lon harus sama-sama terisi atau kosong")
  .refine((station) => station.lat === null || station.coordinate_source !== null, "Koordinat stasiun wajib memiliki coordinate_source");

/** Flag yang boleh tanpa nilai: tidak ada pengamatan, atau konflik duplikat yang tidak diselesaikan. */
const NULLABLE_GWT_FLAGS = new Set(["MISSING", "DUPLICATE_FLAGGED"]);

export const groundwaterObservationSchema = z
  .object({
    id: z.string().min(1),
    station_id: z.string().min(1),
    ...provenanceShape,
    /** Tanggal harian. Jam pengukuran tidak diketahui. */
    observed_at: isoDateSchema,
    /** Meter. Negatif berarti di bawah permukaan. Null berarti tidak ada nilai, bukan nol. */
    gwt_m: z.number().nullable(),
    /** Provenance tambahan dari backend (ID sumber dan hash file). Tidak ada pada mock. */
    source_id: z.string().min(1).nullable().optional(),
    source_sha256: z.string().min(1).nullable().optional(),
  })
  .refine((obs) => obs.quality_flag !== "MISSING" || obs.gwt_m === null, "Observasi MISSING harus bernilai null")
  .refine((obs) => obs.gwt_m !== null || NULLABLE_GWT_FLAGS.has(obs.quality_flag), "gwt_m null hanya untuk MISSING atau DUPLICATE_FLAGGED");

export const groundwaterAvailabilitySchema = z.enum(["AVAILABLE", "NOT_AVAILABLE"]);

export const groundwaterSeriesSchema = z.object({
  station_id: z.string().min(1),
  mode: monitoringModeSchema,
  from: isoDateSchema,
  to: isoDateSchema,
  /** AVAILABLE berarti ada baris pada hasil query, bukan berarti semua baris bernilai. */
  availability: groundwaterAvailabilitySchema,
  /** Penjelasan ketika data tidak tersedia, mis. GWT terkini pada Current Monitoring. */
  notice: z.string().nullable(),
  observations: z.array(groundwaterObservationSchema),
});

export const hotspotVerificationStatusSchema = z.enum(["UNVERIFIED", "IN_VERIFICATION", "VERIFIED", "DISMISSED"]);

export const hotspotSchema = z.object({
  id: z.string().min(1),
  external_key: z.string().min(1),
  source_product: z.string().min(1),
  satellite: z.string().min(1),
  instrument: z.string().min(1),
  ...provenanceShape,
  /** Waktu akuisisi satelit dalam UTC. */
  observed_at: isoDateTimeSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Fire Radiative Power (MW) bila tersedia. */
  frp_mw: z.number().nonnegative().nullable(),
  /** Nilai mentah FIRMS (VIIRS: l/n/h). Bukan probabilitas kebakaran. */
  confidence_raw: z.string().min(1).nullable(),
  /** Belum tersedia dari API; jangan ditebak dari waktu pengamatan. */
  daynight: z.enum(["D", "N"]).nullable(),
  verification_status: hotspotVerificationStatusSchema,
  /** Hasil lookup bbox DEMO frontend, bukan relasi resmi. */
  area_id: z.string().min(1).nullable(),
  /** Waktu import CSV lokal per item (REST). Bukan waktu sync NASA live. */
  imported_at: isoDateTimeSchema.nullable(),
  is_simulation: z.boolean(),
});

/**
 * Asal `last_synced_at`: PAGE_IMPORT = maksimum waktu import item pada halaman ini;
 * SYNC = waktu sync sumber (saat ini hanya demo mock).
 */
export const lastSyncedScopeSchema = z.enum(["PAGE_IMPORT", "SYNC"]);

export const hotspotCollectionSchema = z.object({
  mode: monitoringModeSchema,
  items: z.array(hotspotSchema),
  /** Jumlah seluruh hasil filter, bukan hanya halaman ini. */
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  last_synced_at: isoDateTimeSchema.nullable(),
  last_synced_scope: lastSyncedScopeSchema,
});

/** Status sync FIRMS per wilayah × produk NRT (`GET /api/v1/hotspots/sync-status`). */
export const hotspotSyncAttemptSchema = z.object({
  id: z.string().min(1).optional(),
  status: z.string().min(1),
  date_from: isoDateSchema.nullable().optional(),
  date_to: isoDateSchema.nullable().optional(),
  started_at: isoDateTimeSchema.nullable().optional(),
  completed_at: isoDateTimeSchema.nullable().optional(),
  rows_received: z.number().int().nonnegative().nullable().optional(),
  rows_inserted: z.number().int().nonnegative().nullable().optional(),
  rows_conflicts: z.number().int().nonnegative().nullable().optional(),
  error_code: z.string().nullable().optional(),
}).loose();

export const hotspotSyncStatusSchema = z.object({
  area_id: z.string().min(1),
  source_product: z.string().min(1),
  status: z.enum(["NOT_SYNCED", "RUNNING", "SUCCESS", "FAILED"]),
  last_attempt: hotspotSyncAttemptSchema.nullable(),
  last_successful_at: isoDateTimeSchema.nullable(),
});

export const hotspotSyncInputSchema = z.object({
  area_id: z.string().min(1),
  source_product: z.enum(["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"]),
  day_range: z.number().int().min(1).max(5),
});


export const hotspotMapPointSchema = hotspotSchema.pick({
  id: true, latitude: true, longitude: true, observed_at: true,
  frp_mw: true, verification_status: true,
}).extend({ list_offset: z.number().int().nonnegative() });

export const hotspotMapSchema = z.object({
  mode: monitoringModeSchema,
  items: z.array(hotspotMapPointSchema),
});
