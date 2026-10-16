import { z } from "zod";
import { bboxSchema, isoDateSchema, isoDateTimeSchema, monitoringModeSchema } from "./common";
import { groundwaterAvailabilitySchema, lastSyncedScopeSchema } from "./monitoring";
import { taskStatusSchema } from "./task";

export const areaSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  region: z.string().min(1),
  bbox: bboxSchema,
  /** Asal batas area. Area demo memakai perkiraan, bukan batas administratif resmi. */
  boundary_source: z.string().min(1),
});

export const activitySchema = z.object({
  id: z.string().min(1),
  at: isoDateTimeSchema,
  kind: z.enum(["TASK_CREATED", "TASK_STATUS", "REPORT_SUBMITTED"]),
  task_id: z.string().min(1),
  task_title: z.string().min(1),
  status: taskStatusSchema.nullable(),
  actor_id: z.string().min(1),
  is_simulation: z.boolean(),
});

export const dashboardSummarySchema = z.object({
  mode: monitoringModeSchema,
  as_of: isoDateSchema,
  from: isoDateSchema,
  to: isoDateSchema,
  area_id: z.string().min(1).nullable(),
  hotspots: z.object({
    /** Total seluruh hasil filter dari server (`total`), bukan jumlah item satu halaman. */
    total: z.number().int().nonnegative(),
    unverified: z.number().int().nonnegative(),
    /** PAGE: `unverified` hanya dihitung dari halaman yang dimuat, bukan statistik seluruh hasil. */
    unverified_scope: z.enum(["ALL", "PAGE"]),
    last_synced_at: isoDateTimeSchema.nullable(),
    last_synced_scope: lastSyncedScopeSchema,
    source: z.string().nullable(),
  }),
  tasks: z.object({
    active: z.number().int().nonnegative(),
    awaiting_review: z.number().int().nonnegative(),
    closed: z.number().int().nonnegative(),
  }),
  priorities: z.object({
    HIGH: z.number().int().nonnegative(),
    MEDIUM: z.number().int().nonnegative(),
    LOW: z.number().int().nonnegative(),
    INSUFFICIENT_DATA: z.number().int().nonnegative(),
  }),
  groundwater: z.object({
    availability: groundwaterAvailabilitySchema,
    stations: z.number().int().nonnegative(),
    valid_days: z.number().int().nonnegative(),
    missing_days: z.number().int().nonnegative(),
    /** Konflik duplikat: tanpa nilai, tetapi berbeda makna dari MISSING. */
    duplicate_days: z.number().int().nonnegative(),
    notice: z.string().nullable(),
  }),
  activity: z.array(activitySchema),
});
