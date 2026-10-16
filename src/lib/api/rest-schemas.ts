import { z } from "zod";
import { isoDateSchema, isoDateTimeSchema, monitoringModeSchema } from "@/lib/schemas/common";

// Bentuk JSON HTTP backend (Pydantic/OpenAPI adalah acuan). Payload mentah divalidasi di sini
// terlebih dahulu, lalu dipetakan ke model UI oleh rest-mappers.ts.

export const apiQualityFlagSchema = z.enum(["VALID", "MISSING", "DUPLICATE", "SUSPECT"]);

export const apiStationSchema = z.object({
  /** UUID; Pydantic bertipe str, jadi hanya format 8-4-4-4-12 yang diperiksa (tanpa versi/variant). */
  id: z.guid(),
  code: z.string().min(1),
  region: z.string().min(1).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  coordinate_source: z.string().min(1).nullable(),
  period_start: isoDateSchema.nullable(),
  period_end: isoDateSchema.nullable(),
  source: z.string().min(1).nullable(),
});

export const apiGroundwaterObservationSchema = z.object({
  id: z.string().min(1),
  station_id: z.string().min(1),
  observed_date: isoDateSchema,
  /** 00:00 UTC dari tanggal harian; jam pengukuran tidak diketahui. */
  observed_at: isoDateTimeSchema,
  gwt_m: z.number().nullable(),
  quality_flag: apiQualityFlagSchema,
  source: z.string().min(1),
  source_id: z.string().min(1),
  source_sha256: z.string().min(1),
  mode: monitoringModeSchema,
});

export const apiHotspotSchema = z.object({
  id: z.string().min(1),
  external_key: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  acquired_at: isoDateTimeSchema,
  source_product: z.string().min(1),
  sensor: z.string().min(1),
  satellite: z.string().min(1),
  frp: z.number().nonnegative().nullable(),
  confidence_raw: z.string().min(1).nullable(),
  verification_status: z.enum(["UNVERIFIED", "VERIFIED", "DISMISSED"]),
  source: z.string().min(1),
  quality_flag: apiQualityFlagSchema,
  mode: monitoringModeSchema,
  /** Timestamp import CSV lokal per item; belum waktu sync NASA live. */
  last_synced_at: isoDateTimeSchema,
});

export const apiHotspotPageSchema = z.object({
  items: z.array(apiHotspotSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1).max(1000),
  offset: z.number().int().nonnegative(),
});

const apiSnapshotObservationSchema = z.object({
  id: z.string(),
  date: isoDateSchema,
  value_m: z.number().nullable(),
  quality: z.string(),
}).loose();

/** `input_snapshot` priorities: objek bebas; hanya bagian yang ditampilkan yang divalidasi ketat. */
export const apiPrioritySnapshotSchema = z.object({
  region: z.string().optional(),
  boundary_source: z.string().optional(),
  window_start: isoDateTimeSchema.optional(),
  window_end: isoDateTimeSchema.optional(),
  gwt_scope: z.string().optional(),
  gwt_trends: z.array(z.object({ station: z.string(), delta_m: z.number().nullable(), observations: z.array(apiSnapshotObservationSchema).default([]) }).loose()).default([]),
  hotspots: z.array(z.object({ id: z.string(), acquired_at: isoDateTimeSchema, reviewed: z.boolean().optional() }).loose()).default([]),
  supporting_reports: z.array(z.unknown()).default([]),
  verification_reports: z.array(z.unknown()).default([]),
}).loose();

export const apiPriorityAssessmentSchema = z.object({
  id: z.string().min(1),
  area_id: z.string().min(1),
  decision: z.enum(["REVIEW", "MONITOR", "ESCALATE", "INSUFFICIENT_DATA"]),
  mode: monitoringModeSchema,
  as_of: isoDateTimeSchema,
  priority: z.enum(["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"]),
  explanation: z.string(),
  reason_codes: z.array(z.string().min(1)),
  missing_inputs: z.array(z.string().min(1)),
  input_snapshot: z.record(z.string(), z.unknown()),
  rule_version: z.string().min(1),
  recommended_actions: z.array(z.string()),
  scientific_status: z.literal("heuristic_not_validated"),
});

export type ApiPriorityAssessment = z.infer<typeof apiPriorityAssessmentSchema>;
export type ApiStation = z.infer<typeof apiStationSchema>;
export type ApiGroundwaterObservation = z.infer<typeof apiGroundwaterObservationSchema>;
export type ApiHotspot = z.infer<typeof apiHotspotSchema>;
export type ApiHotspotPage = z.infer<typeof apiHotspotPageSchema>;
