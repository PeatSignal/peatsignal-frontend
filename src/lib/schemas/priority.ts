import { z } from "zod";
import { isoDateSchema, isoDateTimeSchema, monitoringModeSchema } from "./common";

export const priorityLevelSchema = z.enum(["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"]);
export const priorityDecisionSchema = z.enum(["ESCALATE", "REVIEW", "MONITOR", "INSUFFICIENT_DATA"]);

export const assessmentTargetSchema = z.object({
  type: z.enum(["AREA", "HOTSPOT", "STATION"]),
  id: z.string().min(1),
  label: z.string().min(1),
});

/** Satu input yang dipakai engine beserta provenance-nya. */
export const assessmentInputSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean()]).nullable(),
  unit: z.string().nullable(),
  source: z.string().min(1),
  observed_at: z.union([isoDateTimeSchema, isoDateSchema]).nullable(),
});

export const priorityAssessmentSchema = z.object({
  id: z.string().min(1),
  mode: monitoringModeSchema,
  /** Batas waktu informasi. Historical Replay tidak boleh membaca data setelah as_of. */
  as_of: isoDateSchema,
  target: assessmentTargetSchema,
  area_id: z.string().min(1).nullable(),
  priority: priorityLevelSchema,
  decision: priorityDecisionSchema,
  reason_codes: z.array(z.string().min(1)),
  explanation: z.string(),
  missing_inputs: z.array(z.string().min(1)),
  input_snapshot: z.array(assessmentInputSchema),
  recommended_actions: z.array(z.string().min(1)),
  rule_version: z.string().min(1),
  scientific_status: z.literal("heuristic_not_validated"),
  source: z.string().min(1),
  created_at: isoDateTimeSchema,
  is_simulation: z.boolean(),
  /** Snapshot asli dari server (REST) untuk ditelusuri; mock tidak mengisinya. */
  raw_input_snapshot: z.record(z.string(), z.unknown()).nullable().optional(),
});
