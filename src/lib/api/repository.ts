import type { ModeBounds } from "@/lib/domain/periods";
import type {
  Area, Bbox, HotspotMapData, CreateReportInput, CreateTaskInput, DashboardSummary, FieldReport, GroundwaterSeries, HotspotCollection, HotspotSyncAttempt, HotspotSyncInput, HotspotSyncStatus,
  InspectionTask, InspectionTaskDetail, MlForecastInput, MlForecastResponse, MlMetricsResponse, MonitoringMode,
  PriorityAssessment, Station, TaskStatus, UpdateTaskInput, User,
} from "@/types";

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface GroundwaterQuery {
  mode: MonitoringMode;
  station_id: string;
  from: string;
  to: string;
}

export interface HotspotQuery {
  mode: MonitoringMode;
  from: string;
  to: string;
  area_id?: string | null;
  bbox?: Bbox | null;
  source_product?: string | null;
  satellite?: string | null;
  /** Default 200, maksimum 1000. Satu halaman saja; tidak ada pengambilan seluruh dataset otomatis. */
  limit?: number;
  /** Reset ke 0 ketika mode/filter berubah. */
  offset?: number;
}

export interface PriorityQuery {
  mode: MonitoringMode;
  as_of: string;
  area_id?: string | null;
}

export interface TaskQuery {
  mode?: MonitoringMode;
  status?: readonly TaskStatus[];
  assignee_id?: string | null;
}

export interface DashboardQuery {
  mode: MonitoringMode;
  from: string;
  to: string;
  /** Batas informasi; pada Historical Replay sama dengan `to`. */
  as_of: string;
  area_id: string | null;
}

/** Aktor demo. Pada REST, identitas final ditentukan oleh autentikasi server. */
export interface MutationContext {
  actor: User;
}

export interface HealthStatus {
  status: "ok" | "unavailable";
  detail: string | null;
}

/**
 * Satu-satunya pintu data untuk UI. Mock dan REST mengimplementasikan kontrak yang sama
 * sehingga komponen tidak perlu tahu sumber datanya.
 */
export interface GambutOpsRepository {
  readonly kind: "mock" | "rest";

  /** Batas tanggal per mode. Current Monitoring memakai tanggal hari ini sumber data. */
  getModeBounds(mode: MonitoringMode): ModeBounds;

  health(options?: RequestOptions): Promise<HealthStatus>;
  listAreas(options?: RequestOptions): Promise<Area[]>;
  listUsers(options?: RequestOptions): Promise<User[]>;
  /**
   * Masuk sebagai akun demo. REST memverifikasi identitas ke server (`GET /auth/me` dengan token
   * peran); mock memeriksa daftar pengguna demo. Mengembalikan pengguna menurut sumber data.
   */
  signIn(user: User, options?: RequestOptions): Promise<User>;

  listStations(options?: RequestOptions): Promise<Station[]>;
  getGroundwater(query: GroundwaterQuery, options?: RequestOptions): Promise<GroundwaterSeries>;
  listHotspots(query: HotspotQuery, options?: RequestOptions): Promise<HotspotCollection>;
  getHotspotMap(query: Omit<HotspotQuery, "limit" | "offset">, options?: RequestOptions): Promise<HotspotMapData>;
  /** Status sync FIRMS NRT (mode terkini). Tidak memanggil NASA. */
  getHotspotSyncStatus(options?: RequestOptions): Promise<HotspotSyncStatus[]>;
  /** Sync manual FIRMS oleh koordinator. Hanya tersedia pada REST. */
  syncHotspots(input: HotspotSyncInput, context: MutationContext, options?: RequestOptions): Promise<HotspotSyncAttempt>;
  listPriorities(query: PriorityQuery, options?: RequestOptions): Promise<PriorityAssessment[]>;

  listTasks(query?: TaskQuery, options?: RequestOptions): Promise<InspectionTask[]>;
  getTask(id: string, options?: RequestOptions): Promise<InspectionTaskDetail>;
  createTask(input: CreateTaskInput, context: MutationContext, options?: RequestOptions): Promise<InspectionTask>;
  updateTask(id: string, input: UpdateTaskInput, context: MutationContext, options?: RequestOptions): Promise<InspectionTask>;
  createReport(taskId: string, input: CreateReportInput, context: MutationContext, options?: RequestOptions): Promise<FieldReport>;

  getAutomaticRainfall(query: { area_id: "batanghari" | "kubu-raya"; date_to: string }, options?: RequestOptions): Promise<import("@/types").ChirpsRainfall>;

  getChirpsRainfall(query: { area_id: "batanghari" | "kubu-raya"; date_to: string }, options?: RequestOptions): Promise<import("@/types").ChirpsRainfall>;

  assessPrevention(input: import("@/types").PreventionInput, options?: RequestOptions): Promise<import("@/types").PreventionResponse>;

  getMlMetrics(options?: RequestOptions): Promise<MlMetricsResponse>;
  forecastGroundwater(input: MlForecastInput, options?: RequestOptions): Promise<MlForecastResponse>;

  getDashboardSummary(query: DashboardQuery, options?: RequestOptions): Promise<DashboardSummary>;
}
