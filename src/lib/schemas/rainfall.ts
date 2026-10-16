import { z } from "zod";
import { isoDateSchema, isoDateTimeSchema } from "./common";

export const chirpsRainfallSchema = z.object({
  status: z.enum(["AVAILABLE", "PARTIAL", "NOT_AVAILABLE", "PENDING", "ERROR"]),
  dataset_id: z.enum(["UCSB-CHG/CHIRPS/DAILY", "OPEN_METEO_PRECIPITATION"]), provider: z.enum(["CLIMATESERV", "OPEN_METEO"]),
  scope: z.enum(["REGIONAL_DEMO_BBOX", "REGIONAL_REFERENCE_POINT"]), area_id: z.enum(["batanghari", "kubu-raya"]), area_label: z.string(),
  bbox: z.array(z.number()).length(4), reference_point: z.array(z.number()).length(2).nullable().optional(), resolution_degrees: z.number().nullable(),
  statistic: z.enum(["MEAN_VALID_CELLS", "MODEL_GRID_POINT"]), date_from: isoDateSchema, date_to: isoDateSchema,
  retrieved_at: isoDateTimeSchema, note: z.string(), job_id: z.string().nullable().optional(),
  days: z.array(z.object({ date: isoDateSchema, rainfall_mm: z.number().min(0).max(1500).nullable(), valid_cells: z.number().int().nonnegative().nullable(), source_url: z.url(), kind: z.enum(["HISTORICAL_ESTIMATE", "MODEL_ESTIMATE", "FORECAST"]).default("HISTORICAL_ESTIMATE"), eligible_for_assessment: z.boolean().default(true) })).length(7),
});
