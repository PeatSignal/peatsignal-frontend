import { z } from "zod";
import { AREAS, INDONESIA_BBOX, findArea } from "@/lib/domain/areas";
import { composeDashboardSummary } from "@/lib/domain/dashboard";
import { HISTORICAL_BOUNDS, currentBounds } from "@/lib/domain/periods";
import {
  createReportInputSchema, createTaskInputSchema, hotspotMapSchema, fieldReportSchema, hotspotSyncAttemptSchema, hotspotSyncInputSchema, hotspotSyncStatusSchema,
  inspectionTaskDetailSchema, inspectionTaskSchema, mlForecastInputSchema, mlForecastResponseSchema, mlMetricsResponseSchema,
  updateTaskInputSchema, userSchema, preventionInputSchema, preventionResponseSchema, chirpsRainfallSchema,
} from "@/lib/schemas";
import type { User, UserRole } from "@/types";
import { RepositoryError, isAbortError } from "./errors";
import type { GambutOpsRepository, RequestOptions } from "./repository";
import { priorityCutoff, toGroundwaterSeries, toHotspotCollection, toPriorityAssessment, toStation } from "./rest-mappers";
import { apiGroundwaterObservationSchema, apiHotspotPageSchema, apiPriorityAssessmentSchema, apiStationSchema } from "./rest-schemas";

export interface RestRepositoryOptions {
  /** Contoh: http://localhost:8000/api/v1 */
  baseUrl: string;
  fetch?: typeof fetch;
  /** Tanggal hari ini (YYYY-MM-DD) untuk batas Current Monitoring. */
  today?: () => string;
  /** Waktu sekarang (ms) untuk cutoff priorities yang tidak boleh di masa depan. */
  now?: () => number;
  /**
   * Bearer token per peran demo. Backend menentukan identitas dan peran dari token; frontend
   * hanya memilih token sesuai peran yang sedang ditampilkan.
   */
  authTokens?: Partial<Record<UserRole, string | null>>;
}

type QueryValue = string | number | null | undefined;

interface RequestConfig {
  method?: "GET" | "POST" | "PATCH";
  query?: Record<string, QueryValue>;
  body?: unknown;
  actor?: User;
  signal?: AbortSignal;
}

const healthSchema = z.object({ status: z.string() }).loose();

function validateInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new RepositoryError("VALIDATION", parsed.error.issues[0]?.message, { details: parsed.error.issues });
  return parsed.data;
}

function errorFromResponse(status: number, detail: string | null): RepositoryError {
  if (status === 404) return new RepositoryError("NOT_FOUND", detail ?? undefined, { status });
  if (status === 401 || status === 403) return new RepositoryError("FORBIDDEN", detail ?? undefined, { status });
  if (status === 409) return new RepositoryError("ILLEGAL_TRANSITION", detail ?? undefined, { status });
  if (status === 429) return new RepositoryError("HTTP", detail ?? "Terlalu sering. Tunggu beberapa menit sebelum mencoba lagi.", { status });
  if (status === 400 || status === 422) return new RepositoryError("VALIDATION", detail ?? undefined, { status });
  return new RepositoryError("HTTP", detail ?? `Server mengembalikan status ${status}.`, { status });
}

/** FastAPI mengirim `detail` berupa string atau daftar error validasi. */
function readDetail(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("detail" in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0] && typeof detail[0] === "object" && "msg" in detail[0]) return String(detail[0].msg);
  return null;
}

export function createRestRepository(options: RestRepositoryOptions): GambutOpsRepository {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const today = options.today ?? (() => new Date().toISOString().slice(0, 10));
  const now = options.now ?? (() => Date.now());

  function authorization(actor: User): string {
    const token = options.authTokens?.[actor.role]?.trim();
    if (!token) throw new RepositoryError("FORBIDDEN", "Token peran demo belum dikonfigurasi di frontend. Lihat .env.example.");
    return `Bearer ${token}`;
  }

  async function request<T extends z.ZodType>(url: string, schema: T, config: RequestConfig = {}): Promise<z.infer<T>> {
    const target = new URL(url);
    for (const [key, value] of Object.entries(config.query ?? {})) {
      if (value !== null && value !== undefined && value !== "") target.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { Accept: "application/json" };
    if (config.body !== undefined) headers["Content-Type"] = "application/json";
    // Identitas ditentukan server dari token; tidak ada header identitas buatan klien.
    if (config.actor) headers.Authorization = authorization(config.actor);

    let response: Response;
    try {
      response = await fetchImpl(target, {
        method: config.method ?? "GET",
        headers,
        body: config.body === undefined ? undefined : JSON.stringify(config.body),
        signal: config.signal,
      });
    } catch (error) {
      if (isAbortError(error) || config.signal?.aborted) throw new RepositoryError("ABORTED");
      throw new RepositoryError("NETWORK", undefined, { cause: error });
    }

    let body: unknown = null;
    const text = await response.text().catch(() => "");
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        if (response.ok) throw new RepositoryError("INVALID_PAYLOAD", undefined, { status: response.status });
      }
    }
    if (!response.ok) throw errorFromResponse(response.status, readDetail(body));

    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new RepositoryError("INVALID_PAYLOAD", undefined, { status: response.status, details: parsed.error.issues });
    return parsed.data;
  }

  const api = (path: string) => `${baseUrl}${path}`;

  const repository: GambutOpsRepository = {
    kind: "rest",

    getModeBounds(mode) {
      return mode === "HISTORICAL_REPLAY" ? HISTORICAL_BOUNDS : currentBounds(today());
    },

    async health({ signal }: RequestOptions = {}) {
      const result = await request(`${new URL(baseUrl).origin}/health`, healthSchema, { signal });
      return { status: result.status === "ok" ? "ok" : "unavailable", detail: result.status };
    },

    listAreas: async () => [...AREAS],
    listUsers: ({ signal }: RequestOptions = {}) => request(api("/users"), z.array(userSchema), { signal }),

    async signIn(user, { signal } = {}) {
      const me = await request(api("/auth/me"), userSchema, { actor: user, signal });
      if (me.role !== user.role) throw new RepositoryError("FORBIDDEN", "Akun dari server tidak sesuai dengan peran yang dipilih.");
      return me;
    },
    async listStations({ signal }: RequestOptions = {}) {
      const stations = await request(api("/stations"), z.array(apiStationSchema), { signal });
      return stations.map(toStation);
    },

    async getGroundwater(query, { signal } = {}) {
      const rows = await request(api(`/stations/${encodeURIComponent(query.station_id)}/groundwater`), z.array(apiGroundwaterObservationSchema), {
        query: { from: query.from, to: query.to, mode: query.mode }, signal,
      });
      return toGroundwaterSeries(query, rows, today());
    },

    async listHotspots(query, { signal } = {}) {
      const bbox = query.mode === "CURRENT_MONITORING"
        ? INDONESIA_BBOX
        : query.bbox ?? findArea(query.area_id)?.bbox ?? null;
      const page = await request(api("/hotspots"), apiHotspotPageSchema, {
        query: {
          from: query.from, to: query.to, mode: query.mode, bbox: bbox?.join(","),
          source_product: query.source_product, satellite: query.satellite, limit: query.limit, offset: query.offset,
        },
        signal,
      });
      return toHotspotCollection(query, page);
    },

    async getHotspotMap(query, { signal } = {}) {
      const bbox = query.mode === "CURRENT_MONITORING"
        ? INDONESIA_BBOX : query.bbox ?? findArea(query.area_id)?.bbox ?? null;
      const result = await request(api("/hotspots/map"), hotspotMapSchema, {
        query: { from: query.from, to: query.to, mode: query.mode, bbox: bbox?.join(","),
          source_product: query.source_product, satellite: query.satellite }, signal,
      });
      if (result.mode !== query.mode) throw new RepositoryError("INVALID_PAYLOAD", "Mode peta tidak sesuai permintaan.");
      return result;
    },

    getHotspotSyncStatus: ({ signal }: RequestOptions = {}) => request(api("/hotspots/sync-status"), z.array(hotspotSyncStatusSchema), { signal }),

    async syncHotspots(input, { actor }, { signal } = {}) {
      return request(api("/admin/hotspots/sync"), hotspotSyncAttemptSchema, { method: "POST", body: validateInput(hotspotSyncInputSchema, input), actor, signal });
    },

    async listPriorities(query, { signal } = {}) {
      const rows = await request(api("/priorities"), z.array(apiPriorityAssessmentSchema), {
        query: { mode: query.mode, as_of: priorityCutoff(query.as_of, now()), area_id: query.area_id }, signal,
      });
      const items = rows.map((row) => toPriorityAssessment(row, query));
      if (items.some((item) => item.as_of > query.as_of)) {
        throw new RepositoryError("INVALID_PAYLOAD", "Assessment berisi mode atau as_of yang tidak sesuai permintaan.");
      }
      return query.area_id ? items.filter((item) => item.area_id === query.area_id) : items;
    },

    listTasks(query = {}, { signal } = {}) {
      return request(api("/tasks"), z.array(inspectionTaskSchema), {
        query: { mode: query.mode, status: query.status?.join(","), assignee_id: query.assignee_id }, signal,
      });
    },

    getTask: (id, { signal } = {}) => request(api(`/tasks/${encodeURIComponent(id)}`), inspectionTaskDetailSchema, { signal }),

    async createTask(input, { actor }, { signal } = {}) {
      return request(api("/tasks"), inspectionTaskSchema, { method: "POST", body: validateInput(createTaskInputSchema, input), actor, signal });
    },

    async updateTask(id, input, { actor }, { signal } = {}) {
      return request(api(`/tasks/${encodeURIComponent(id)}`), inspectionTaskSchema, { method: "PATCH", body: validateInput(updateTaskInputSchema, input), actor, signal });
    },

    async createReport(taskId, input, { actor }, { signal } = {}) {
      return request(api(`/tasks/${encodeURIComponent(taskId)}/reports`), fieldReportSchema, { method: "POST", body: validateInput(createReportInputSchema, input), actor, signal });
    },

    getAutomaticRainfall: (query, { signal } = {}) => request(api("/rainfall/automatic"), chirpsRainfallSchema, { query, signal }),

    getChirpsRainfall: (query, { signal } = {}) => request(api("/rainfall/chirps"), chirpsRainfallSchema, { query, signal }),

    async assessPrevention(input, { signal } = {}) {
      return request(api("/prevention/assess"), preventionResponseSchema, { method: "POST", body: validateInput(preventionInputSchema, input), signal });
    },

    getMlMetrics: ({ signal }: RequestOptions = {}) => request(api("/ml/metrics"), mlMetricsResponseSchema, { signal }),

    async forecastGroundwater(input, { signal } = {}) {
      return request(api("/ml/forecast"), mlForecastResponseSchema, { method: "POST", body: validateInput(mlForecastInputSchema, input), signal });
    },

    getDashboardSummary(query, options = {}) {
      return composeDashboardSummary(repository, query, options);
    },
  };

  return repository;
}
