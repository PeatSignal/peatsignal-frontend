import type { z } from "zod";
import type * as s from "@/lib/schemas";

// Tipe entitas diturunkan dari schema Zod agar validasi runtime dan tipe statis tidak pernah berbeda.

export type MonitoringMode = z.infer<typeof s.monitoringModeSchema>;
export type QualityFlag = z.infer<typeof s.qualityFlagSchema>;
export type Bbox = z.infer<typeof s.bboxSchema>;

export type Station = z.infer<typeof s.stationSchema>;
export type GroundwaterObservation = z.infer<typeof s.groundwaterObservationSchema>;
export type GroundwaterAvailability = z.infer<typeof s.groundwaterAvailabilitySchema>;
export type GroundwaterSeries = z.infer<typeof s.groundwaterSeriesSchema>;

export type Hotspot = z.infer<typeof s.hotspotSchema>;
export type HotspotVerificationStatus = z.infer<typeof s.hotspotVerificationStatusSchema>;
export type HotspotCollection = z.infer<typeof s.hotspotCollectionSchema>;
export type LastSyncedScope = z.infer<typeof s.lastSyncedScopeSchema>;
export type HotspotSyncAttempt = z.infer<typeof s.hotspotSyncAttemptSchema>;
export type HotspotSyncStatus = z.infer<typeof s.hotspotSyncStatusSchema>;
export type HotspotSyncInput = z.infer<typeof s.hotspotSyncInputSchema>;

export type PriorityLevel = z.infer<typeof s.priorityLevelSchema>;
export type PriorityDecision = z.infer<typeof s.priorityDecisionSchema>;
export type AssessmentInput = z.infer<typeof s.assessmentInputSchema>;
export type PriorityAssessment = z.infer<typeof s.priorityAssessmentSchema>;

export type UserRole = z.infer<typeof s.userRoleSchema>;
export type User = z.infer<typeof s.userSchema>;
export type TaskStatus = z.infer<typeof s.taskStatusSchema>;
export type TaskStatusChange = z.infer<typeof s.taskStatusChangeSchema>;
export type InspectionTask = z.infer<typeof s.inspectionTaskSchema>;
export type InspectionTaskDetail = z.infer<typeof s.inspectionTaskDetailSchema>;
export type FieldReportResult = z.infer<typeof s.fieldReportResultSchema>;
export type FieldReport = z.infer<typeof s.fieldReportSchema>;
export type CreateTaskInput = z.infer<typeof s.createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof s.updateTaskInputSchema>;
export type CreateReportInput = z.infer<typeof s.createReportInputSchema>;

export type MlExperiment = z.infer<typeof s.mlExperimentSchema>;
export type MlMetricsResponse = z.infer<typeof s.mlMetricsResponseSchema>;
export type MlForecastInput = z.infer<typeof s.mlForecastInputSchema>;
export type MlForecastResponse = z.infer<typeof s.mlForecastResponseSchema>;

export type Area = z.infer<typeof s.areaSchema>;
export type Activity = z.infer<typeof s.activitySchema>;
export type DashboardSummary = z.infer<typeof s.dashboardSummarySchema>;

export type HotspotMapPoint = z.infer<typeof s.hotspotMapPointSchema>;
export type HotspotMapData = z.infer<typeof s.hotspotMapSchema>;

export type PreventionInput = z.infer<typeof s.preventionInputSchema>;
export type PreventionResponse = z.infer<typeof s.preventionResponseSchema>;

export type ChirpsRainfall = z.infer<typeof s.chirpsRainfallSchema>;
