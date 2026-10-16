import { z } from "zod";

/** Mode pemantauan. Setiap query, cache, dan observasi wajib membawa mode. */
export const monitoringModeSchema = z.enum(["HISTORICAL_REPLAY", "CURRENT_MONITORING"]);

/** Tanggal kalender ISO (YYYY-MM-DD), dipakai untuk observasi harian GWT. */
export const isoDateSchema = z.iso.date();

/** Waktu ISO 8601 dengan zona waktu eksplisit. Waktu satelit disimpan UTC. */
export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const qualityFlagSchema = z.enum([
  "VALID",
  "MISSING",
  "SUSPECT",
  "DUPLICATE_FLAGGED",
]);

/** Provenance minimum yang menempel pada setiap observasi. */
export const provenanceShape = {
  source: z.string().min(1),
  observed_at: z.union([isoDateTimeSchema, isoDateSchema]),
  quality_flag: qualityFlagSchema,
  mode: monitoringModeSchema,
};

/** [minLon, minLat, maxLon, maxLat] dalam WGS84. */
export const bboxSchema = z
  .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90), z.number().min(-180).max(180), z.number().min(-90).max(90)])
  .refine(([minLon, minLat, maxLon, maxLat]) => minLon < maxLon && minLat < maxLat, "bbox tidak valid");
