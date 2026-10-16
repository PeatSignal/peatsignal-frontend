import { z } from "zod";
import { isoDateTimeSchema, monitoringModeSchema } from "./common";
import { priorityLevelSchema } from "./priority";

export const userRoleSchema = z.enum(["coordinator", "field_officer"]);

export const userSchema = z.object({
  id: z.string().min(1),
  role: userRoleSchema,
  display_name: z.string().min(1),
});

export const taskStatusSchema = z.enum([
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "VERIFIED",
  "DISMISSED",
  "NEEDS_FOLLOWUP",
]);

export const taskStatusChangeSchema = z.object({
  from: taskStatusSchema.nullable(),
  to: taskStatusSchema,
  actor_id: z.string().min(1),
  actor_role: userRoleSchema,
  at: isoDateTimeSchema,
  note: z.string().nullable(),
});

export const inspectionTaskSchema = z.object({
  id: z.string().min(1),
  mode: monitoringModeSchema,
  title: z.string().min(1),
  status: taskStatusSchema,
  priority: priorityLevelSchema,
  assessment_id: z.string().min(1).nullable(),
  hotspot_id: z.string().min(1).nullable(),
  area_id: z.string().min(1).nullable(),
  assignee_id: z.string().min(1).nullable(),
  created_by: z.string().min(1),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  note: z.string().nullable(),
  history: z.array(taskStatusChangeSchema),
  is_simulation: z.boolean(),
});

export const fieldReportResultSchema = z.enum([
  "ACTIVE_FIRE_FOUND",
  "BURN_SCAR_FOUND",
  "NO_FIRE_FOUND",
  "LOCATION_INACCESSIBLE",
]);

export const fieldReportSchema = z.object({
  id: z.string().min(1),
  task_id: z.string().min(1),
  observed_at: isoDateTimeSchema,
  result: fieldReportResultSchema,
  note: z.string(),
  evidence_url: z.url().nullable(),
  submitted_by: z.string().min(1),
  submitted_at: isoDateTimeSchema,
  is_simulation: z.boolean(),
});

export const inspectionTaskDetailSchema = inspectionTaskSchema.extend({
  reports: z.array(fieldReportSchema),
});

// ---- Input mutasi (dipakai form RHF + Zod dan kedua adapter) ----

export const createTaskInputSchema = z
  .object({
    mode: monitoringModeSchema,
    title: z.string().trim().min(5, "Judul minimal 5 karakter").max(120, "Judul maksimal 120 karakter"),
    priority: priorityLevelSchema,
    assessment_id: z.string().min(1).nullable(),
    hotspot_id: z.string().min(1).nullable(),
    area_id: z.string().min(1).nullable(),
    assignee_id: z.string().min(1).nullable(),
    note: z.string().trim().max(500, "Catatan maksimal 500 karakter").nullable(),
  })
  .refine((input) => input.assessment_id !== null || input.hotspot_id !== null, {
    message: "Tugas harus merujuk assessment atau hotspot",
    path: ["assessment_id"],
  });

export const updateTaskInputSchema = z
  .object({
    status: taskStatusSchema.optional(),
    assignee_id: z.string().min(1).nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, "Tidak ada perubahan");

export const createReportInputSchema = z.object({
  observed_at: isoDateTimeSchema,
  result: fieldReportResultSchema,
  note: z.string().trim().min(3, "Catatan minimal 3 karakter").max(1000, "Catatan maksimal 1000 karakter"),
  evidence_url: z.url("URL bukti tidak valid").nullable(),
  is_simulation: z.boolean(),
});
