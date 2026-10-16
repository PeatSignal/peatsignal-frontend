import type { z } from "zod";
import { RepositoryError, throwIfAborted } from "@/lib/api/errors";
import type { GambutOpsRepository, RequestOptions } from "@/lib/api/repository";
import { AREAS, findArea, isInBbox } from "@/lib/domain/areas";
import { CURRENT_GWT_NOTICE, composeDashboardSummary } from "@/lib/domain/dashboard";
import { HOTSPOT_DEFAULT_LIMIT, HOTSPOT_MAX_LIMIT } from "@/lib/domain/pagination";
import { HISTORICAL_BOUNDS, currentBounds } from "@/lib/domain/periods";
import { canSubmitReport, canTransition } from "@/lib/domain/task-state-machine";
import { createReportInputSchema, createTaskInputSchema, updateTaskInputSchema } from "@/lib/schemas";
import type { FieldReport, GroundwaterObservation, Hotspot, HotspotVerificationStatus, InspectionTask, MonitoringMode, TaskStatusChange, User } from "@/types";
import { CURRENT_DEMO_DATE, CURRENT_DEMO_LAST_SYNC, CURRENT_HOTSPOTS, GROUNDWATER, HISTORICAL_DEMO_LAST_SYNC, HISTORICAL_HOTSPOTS, STATIONS, USERS } from "./fixtures";
import { evaluateAll } from "./priority-rules";
import { unavailableAutomatic, unavailableChirps, assessMockPrevention } from "./prevention";
import { preventionInputSchema } from "@/lib/schemas/prevention";
import { createMemoryStorage, getBrowserStorage, loadStore, saveStore, type DemoStore, type KeyValueStorage, type StorageIssue } from "./storage";

export interface MockRepositoryOptions {
  /** Default: localStorage browser, jatuh ke memori bila tidak tersedia. */
  storage?: KeyValueStorage;
  /** Jeda simulasi jaringan agar state loading dapat diuji. */
  latencyMs?: number;
  now?: () => Date;
  onStorageIssue?: (issue: StorageIssue) => void;
}

const clone = <T,>(value: T): T => structuredClone(value);

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new RepositoryError("ABORTED"));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function parseOrThrow<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new RepositoryError("VALIDATION", parsed.error.issues[0]?.message ?? "Isian belum valid.", { details: parsed.error.issues });
  }
  return parsed.data;
}

function assertDateRange(from: string, to: string) {
  if (from > to) throw new RepositoryError("VALIDATION", "Tanggal awal harus sebelum tanggal akhir.");
}

const SUPPORTING_RESULTS = new Set(["ACTIVE_FIRE_FOUND", "BURN_SCAR_FOUND"]);

export function createMockRepository(options: MockRepositoryOptions = {}): GambutOpsRepository {
  const latency = options.latencyMs ?? 180;
  const now = options.now ?? (() => new Date());
  let storage: KeyValueStorage | null = options.storage ?? null;
  let store: DemoStore | null = null;

  // Store dibaca saat pertama dipakai (bukan saat konstruksi) agar aman ketika dirender di server.
  function getStore(): DemoStore {
    if (!store) {
      storage ??= getBrowserStorage() ?? createMemoryStorage();
      store = loadStore(storage, options.onStorageIssue);
    }
    return store;
  }

  function persist() {
    if (store && storage) saveStore(storage, store, options.onStorageIssue);
  }

  function nextId(prefix: string) {
    const current = getStore();
    const id = `${prefix}-${current.next_id}`;
    current.next_id += 1;
    return id;
  }

  async function respond<T>(signal: AbortSignal | undefined, produce: () => T): Promise<T> {
    await sleep(latency, signal);
    const result = produce();
    throwIfAborted(signal);
    return clone(result);
  }

  function findUser(id: string): User | undefined {
    return USERS.find((user) => user.id === id);
  }

  function requireTask(id: string): InspectionTask {
    const task = getStore().tasks.find((item) => item.id === id);
    if (!task) throw new RepositoryError("NOT_FOUND", "Tugas tidak ditemukan.");
    return task;
  }

  /** Status verifikasi hotspot diturunkan dari tugas terbaru yang merujuknya. */
  function hotspotStatus(hotspotId: string): HotspotVerificationStatus {
    const { tasks, reports } = getStore();
    const task = tasks.filter((item) => item.hotspot_id === hotspotId).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    if (!task || task.status === "OPEN") return "UNVERIFIED";
    if (task.status === "DISMISSED") return "DISMISSED";
    if (task.status === "VERIFIED") {
      const report = reports.filter((item) => item.task_id === task.id).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0];
      if (!report) return "UNVERIFIED";
      if (SUPPORTING_RESULTS.has(report.result)) return "VERIFIED";
      return report.result === "NO_FIRE_FOUND" ? "DISMISSED" : "UNVERIFIED";
    }
    return "IN_VERIFICATION";
  }

  function hotspotsFor(mode: MonitoringMode): Hotspot[] {
    const source = mode === "HISTORICAL_REPLAY" ? HISTORICAL_HOTSPOTS : CURRENT_HOTSPOTS;
    return source.map((hotspot) => ({ ...hotspot, verification_status: hotspotStatus(hotspot.id) }));
  }

  function groundwaterByRegion(): Map<string, GroundwaterObservation[][]> {
    const byRegion = new Map<string, GroundwaterObservation[][]>();
    for (const station of STATIONS) {
      if (!station.region) continue;
      const list = byRegion.get(station.region) ?? [];
      list.push(GROUNDWATER.get(station.id) ?? []);
      byRegion.set(station.region, list);
    }
    return byRegion;
  }

  function change(task: InspectionTask, to: InspectionTask["status"], actor: User, note: string | null): TaskStatusChange {
    return { from: task.status, to, actor_id: actor.id, actor_role: actor.role, at: now().toISOString(), note };
  }

  const repository: GambutOpsRepository = {
    kind: "mock",

    getModeBounds(mode) {
      return mode === "HISTORICAL_REPLAY" ? HISTORICAL_BOUNDS : currentBounds(CURRENT_DEMO_DATE);
    },

    health: ({ signal }: RequestOptions = {}) => respond(signal, () => ({ status: "ok" as const, detail: "Mock repository (DEMO)" })),
    listAreas: ({ signal }: RequestOptions = {}) => respond(signal, () => [...AREAS]),
    listUsers: ({ signal }: RequestOptions = {}) => respond(signal, () => [...USERS]),

    signIn(user, { signal } = {}) {
      return respond(signal, () => {
        const known = USERS.find((item) => item.id === user.id && item.role === user.role);
        if (!known) throw new RepositoryError("FORBIDDEN", "Akun demo tidak dikenal.");
        return known;
      });
    },
    listStations: ({ signal }: RequestOptions = {}) => respond(signal, () => [...STATIONS]),

    getGroundwater(query, { signal } = {}) {
      return respond(signal, () => {
        assertDateRange(query.from, query.to);
        const station = STATIONS.find((item) => item.id === query.station_id);
        if (!station) throw new RepositoryError("NOT_FOUND", `Stasiun ${query.station_id} tidak ditemukan.`);
        if (query.mode === "CURRENT_MONITORING") {
          return { station_id: station.id, mode: query.mode, from: query.from, to: query.to, availability: "NOT_AVAILABLE" as const, notice: CURRENT_GWT_NOTICE, observations: [] };
        }
        const observations = (GROUNDWATER.get(station.id) ?? []).filter((obs) => obs.observed_at >= query.from && obs.observed_at <= query.to);
        return {
          station_id: station.id, mode: query.mode, from: query.from, to: query.to,
          availability: observations.length > 0 ? "AVAILABLE" as const : "NOT_AVAILABLE" as const,
          notice: observations.length > 0 ? null : `Tidak ada pengamatan ${station.code} pada periode ini. Data stasiun tersedia ${station.period_start} s.d. ${station.period_end}.`,
          observations,
        };
      });
    },

    listHotspots(query, { signal } = {}) {
      return respond(signal, () => {
        assertDateRange(query.from, query.to);
        const limit = query.limit ?? HOTSPOT_DEFAULT_LIMIT;
        const offset = query.offset ?? 0;
        if (!Number.isInteger(limit) || limit < 1 || limit > HOTSPOT_MAX_LIMIT) throw new RepositoryError("VALIDATION", `limit harus 1–${HOTSPOT_MAX_LIMIT}.`);
        if (!Number.isInteger(offset) || offset < 0) throw new RepositoryError("VALIDATION", "offset tidak boleh negatif.");
        const bbox = query.bbox ?? findArea(query.area_id)?.bbox ?? null;
        const matches = hotspotsFor(query.mode)
          .filter((hotspot) => {
            const date = hotspot.observed_at.slice(0, 10);
            if (date < query.from || date > query.to) return false;
            if (bbox && !isInBbox(hotspot.longitude, hotspot.latitude, bbox)) return false;
            if (query.source_product && hotspot.source_product !== query.source_product) return false;
            if (query.satellite && hotspot.satellite !== query.satellite) return false;
            return true;
          })
          // Urutan sama dengan backend: waktu akuisisi turun, lalu ID.
          .sort((a, b) => b.observed_at.localeCompare(a.observed_at) || a.id.localeCompare(b.id));
        return {
          mode: query.mode,
          items: matches.slice(offset, offset + limit),
          total: matches.length,
          limit,
          offset,
          last_synced_at: query.mode === "CURRENT_MONITORING" ? CURRENT_DEMO_LAST_SYNC : HISTORICAL_DEMO_LAST_SYNC,
          last_synced_scope: "SYNC" as const,
        };
      });
    },

    async getHotspotMap(query, options = {}) {
      const first = await repository.listHotspots({ ...query, limit: HOTSPOT_MAX_LIMIT, offset: 0 }, options);
      const items = [...first.items];
      for (let offset = first.items.length; offset < first.total; offset += HOTSPOT_MAX_LIMIT) {
        const page = await repository.listHotspots({ ...query, limit: HOTSPOT_MAX_LIMIT, offset }, options);
        items.push(...page.items);
      }
      return { mode: query.mode, items: items.map((item, list_offset) => ({ ...item, list_offset })) };
    },

    getHotspotSyncStatus({ signal } = {}) {
      // Status DEMO: satu waktu sync tetap untuk setiap target, tanpa menghubungi NASA.
      return respond(signal, () => [{ id: "indonesia" }].flatMap((area) => (["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"] as const).map((product) => ({
        area_id: area.id, source_product: product, status: "SUCCESS" as const, last_attempt: null, last_successful_at: CURRENT_DEMO_LAST_SYNC,
      }))));
    },

    syncHotspots(_input, _context, { signal } = {}) {
      return respond(signal, () => {
        throw new RepositoryError("HTTP", "Sinkronisasi NASA FIRMS hanya tersedia saat terhubung ke server PeatSignal.");
      });
    },

    listPriorities(query, { signal } = {}) {
      return respond(signal, () => {
        const { tasks, reports } = getStore();
        const assessments = evaluateAll({
          mode: query.mode,
          as_of: query.as_of,
          hotspots: hotspotsFor(query.mode),
          groundwaterByRegion: groundwaterByRegion(),
          tasks,
          reports,
        });
        return query.area_id ? assessments.filter((item) => item.area_id === query.area_id) : assessments;
      });
    },

    listTasks(query = {}, { signal } = {}) {
      return respond(signal, () => getStore().tasks
        .filter((task) => !query.mode || task.mode === query.mode)
        .filter((task) => !query.status?.length || query.status.includes(task.status))
        .filter((task) => !query.assignee_id || task.assignee_id === query.assignee_id)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
    },

    getTask(id, { signal } = {}) {
      return respond(signal, () => {
        const task = requireTask(id);
        const reports = getStore().reports.filter((report) => report.task_id === id).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
        return { ...task, reports };
      });
    },

    createTask(rawInput, { actor }, { signal } = {}) {
      return respond(signal, () => {
        const input = parseOrThrow(createTaskInputSchema, rawInput);
        if (actor.role !== "coordinator") throw new RepositoryError("FORBIDDEN", "Hanya koordinator yang dapat membuat tugas.");
        if (input.hotspot_id && !hotspotsFor(input.mode).some((hotspot) => hotspot.id === input.hotspot_id)) {
          throw new RepositoryError("VALIDATION", "Hotspot tidak ditemukan pada mode ini.");
        }
        if (input.assignee_id && findUser(input.assignee_id)?.role !== "field_officer") {
          throw new RepositoryError("VALIDATION", "Petugas tidak ditemukan.");
        }
        const at = now().toISOString();
        const task: InspectionTask = {
          id: nextId("task"),
          mode: input.mode,
          title: input.title,
          status: "OPEN",
          priority: input.priority,
          assessment_id: input.assessment_id,
          hotspot_id: input.hotspot_id,
          area_id: input.area_id,
          assignee_id: null,
          created_by: actor.id,
          created_at: at,
          updated_at: at,
          note: input.note || null,
          history: [{ from: null, to: "OPEN", actor_id: actor.id, actor_role: actor.role, at, note: null }],
          is_simulation: true,
        };
        if (input.assignee_id) {
          task.history.push(change(task, "ASSIGNED", actor, null));
          task.status = "ASSIGNED";
          task.assignee_id = input.assignee_id;
        }
        getStore().tasks.push(task);
        persist();
        return task;
      });
    },

    updateTask(id, rawInput, { actor }, { signal } = {}) {
      return respond(signal, () => {
        const input = parseOrThrow(updateTaskInputSchema, rawInput);
        const task = requireTask(id);
        const nextAssignee = input.assignee_id === undefined ? task.assignee_id : input.assignee_id;
        if (input.assignee_id !== undefined || input.note !== undefined) {
          if (actor.role !== "coordinator") throw new RepositoryError("FORBIDDEN", "Hanya koordinator yang dapat mengubah petugas atau catatan.");
        }
        if (input.assignee_id && findUser(input.assignee_id)?.role !== "field_officer") {
          throw new RepositoryError("VALIDATION", "Petugas tidak ditemukan.");
        }
        if (input.assignee_id !== undefined && input.assignee_id !== task.assignee_id && input.status !== "ASSIGNED" && !["OPEN", "ASSIGNED"].includes(task.status)) {
          throw new RepositoryError("ILLEGAL_TRANSITION", "Petugas hanya dapat diganti sebelum pekerjaan dimulai.");
        }
        if (input.status && input.status !== task.status) {
          const check = canTransition(task, input.status, actor, { nextAssigneeId: nextAssignee });
          if (!check.ok) throw new RepositoryError(check.code, check.reason);
          task.history.push(change(task, input.status, actor, input.note ?? null));
          task.status = input.status;
        }
        task.assignee_id = nextAssignee;
        if (input.note !== undefined) task.note = input.note;
        task.updated_at = now().toISOString();
        persist();
        return task;
      });
    },

    createReport(taskId, rawInput, { actor }, { signal } = {}) {
      return respond(signal, () => {
        const input = parseOrThrow(createReportInputSchema, rawInput);
        if (!input.is_simulation) throw new RepositoryError("VALIDATION", "Mode demo hanya menerima laporan SIMULASI.");
        const task = requireTask(taskId);
        const check = canSubmitReport(task, actor);
        if (!check.ok) throw new RepositoryError(check.code, check.reason);
        const at = now().toISOString();
        const report: FieldReport = { id: nextId("report"), task_id: task.id, ...input, submitted_by: actor.id, submitted_at: at, is_simulation: true };
        task.history.push(change(task, "SUBMITTED", actor, "Laporan SIMULASI dikirim"));
        task.status = "SUBMITTED";
        task.updated_at = at;
        getStore().reports.push(report);
        persist();
        return report;
      });
    },

    getAutomaticRainfall: (query, { signal } = {}) => respond(signal, () => unavailableAutomatic(query.area_id, query.date_to)),

    getChirpsRainfall: (query, { signal } = {}) => respond(signal, () => unavailableChirps(query.area_id, query.date_to)),

    assessPrevention: (input, { signal } = {}) => respond(signal, () => assessMockPrevention(parseOrThrow(preventionInputSchema, input), now().toISOString().slice(0, 10))),

    getMlMetrics: ({ signal }: RequestOptions = {}) => respond(signal, () => ({
      status: "NOT_AVAILABLE" as const,
      reason: "Model belum tersedia. Hasil eksperimen hanya ditampilkan dari API backend, bukan dari data demo.",
    })),

    forecastGroundwater: (_input, { signal }: RequestOptions = {}) => respond(signal, () => ({
      status: "REJECTED" as const,
      reason: "Forecast hanya tersedia dari API backend dengan input GWT terbaru yang lengkap.",
    })),

    getDashboardSummary(query, options = {}) {
      return composeDashboardSummary(repository, query, options);
    },
  };

  return repository;
}
