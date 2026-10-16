import { z } from "zod";
import { isoDateSchema, isoDateTimeSchema } from "./common";

const releaseGateSchema = z.enum(["EXPERIMENT_ONLY", "ELIGIBLE_FOR_HISTORICAL_FORECAST"]);

const errorMetricsSchema = z.object({
  mae_cm: z.number().nonnegative(),
  rmse_cm: z.number().nonnegative(),
});

export const mlPredictionPointSchema = z.object({
  date: isoDateSchema,
  actual_m: z.number().nullable(),
  predicted_m: z.number().nullable(),
  baseline_m: z.number().nullable(),
});

export const mlExperimentSchema = z.object({
  model_version: z.string().min(1),
  model_type: z.string().min(1),
  station_id: z.string().min(1),
  station_code: z.string().min(1),
  target: z.literal("GWT_T_PLUS_1_DAY"),
  features: z.array(z.string().min(1)),
  training_period: z.object({ from: isoDateSchema, to: isoDateSchema }),
  test_period: z.object({ from: isoDateSchema, to: isoDateSchema }),
  test_size: z.number().int().nonnegative(),
  model_metrics: errorMetricsSchema,
  baseline_metrics: errorMetricsSchema,
  beats_baseline: z.boolean(),
  predictions: z.array(mlPredictionPointSchema),
  trained_at: isoDateTimeSchema,
  is_simulation: z.boolean(),
  release_gate: releaseGateSchema,
  limitations: z.array(z.string().min(1)),
});

/** Hasil ML hanya berasal dari API. Mock mengembalikan NOT_AVAILABLE, bukan metrik rekaan. */
export const mlMetricsResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("NOT_AVAILABLE"), reason: z.string().min(1) }),
  z.object({ status: z.literal("AVAILABLE"), experiments: z.array(mlExperimentSchema) }),
]);

export const mlForecastInputSchema = z.object({
  station_id: z.string().min(1),
  date: isoDateSchema,
});

export const mlForecastResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("REJECTED"), reason: z.string().min(1) }),
  z.object({
    status: z.literal("OK"),
    station_id: z.string().min(1),
    input_date: isoDateSchema,
    forecast_date: isoDateSchema,
    predicted_gwt_m: z.number(),
    baseline_gwt_m: z.number(),
    model_version: z.string().min(1),
    release_gate: releaseGateSchema,
  }),
]);
