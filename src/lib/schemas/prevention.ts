import { z } from "zod";
import { isoDateSchema } from "./common";
import { chirpsRainfallSchema } from "./rainfall";
import { addDays } from "@/lib/domain/dates";

export const preventionInputSchema = z.object({
  station_code: z.enum(["BRG3", "BRG6"]),
  source_kind: z.enum(["MANUAL", "DEMO"]),
  rainfall_mode: z.enum(["MANUAL", "CHIRPS", "AUTO"]).optional(),
  source_note: z.string().trim().min(3, "Jelaskan sumber pengukuran (minimal 3 karakter).").max(300),
  readings: z.array(z.object({
    date: isoDateSchema,
    gwt_m: z.number().min(-10).max(2),
    rainfall_mm: z.number().min(0).max(1500).nullable(),
  })).length(7),
}).superRefine((input, ctx) => {
  const rows = [...input.readings].sort((a, b) => a.date.localeCompare(b.date));
  if (rows.some((row, i) => row.date !== addDays(rows[0]!.date, i))) ctx.addIssue({ code: "custom", message: "Isi tujuh tanggal berurutan tanpa duplikat." });
  if (rows[6]!.date > new Date().toISOString().slice(0, 10)) ctx.addIssue({ code: "custom", message: "Pengukuran tidak boleh bertanggal masa depan (UTC)." });
});

export const preventionResponseSchema = z.object({
  station_code: z.string(), source_kind: z.enum(["MANUAL", "DEMO"]), source_note: z.string(),
  is_simulation: z.boolean(), input_date: isoDateSchema, freshness: z.enum(["RECENT", "STALE"]),
  observation_status: z.enum(["USER_PROVIDED_UNVERIFIED", "SIMULATED"]),
  forecast: z.object({
    status: z.enum(["EXPERIMENTAL", "BASELINE_ONLY", "NOT_AVAILABLE"]), reason: z.string(), forecast_date: isoDateSchema,
    selected_method: z.enum(["PERSISTENCE", "RANDOM_FOREST"]).nullable(),
    selected_gwt_m: z.number().nullable(), model_gwt_m: z.number().nullable(), baseline_gwt_m: z.number().nullable(),
    model_version: z.string().nullable(), model_mae_cm: z.number().nullable(), baseline_mae_cm: z.number().nullable(),
  }),
  prevention: z.object({
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "INSUFFICIENT_DATA"]), explanation: z.string(),
    reasons: z.array(z.string()), recommended_actions: z.array(z.string()), missing_inputs: z.array(z.string()),
    latest_gwt_m: z.number(), change_m: z.number(), rainfall_7d_mm: z.number().nullable(),
    rainfall_days: z.number().int(), dry_spell_days: z.number().int().nullable(), reference_gwt_m: z.number(),
    rule_version: z.string(), scientific_status: z.literal("heuristic_not_validated"), forecast_used: z.literal(false),
  }),
  limitations: z.array(z.string()),
  rainfall: chirpsRainfallSchema.nullable().optional(),
  readings: z.array(z.object({ date: isoDateSchema, gwt_m: z.number(), rainfall_mm: z.number().nullable() })).optional(),
});
