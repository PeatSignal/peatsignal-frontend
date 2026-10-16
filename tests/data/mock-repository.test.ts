import assert from "node:assert/strict";
import test from "node:test";
import { RepositoryError } from "@/lib/api/errors";
import { createMockRepository } from "@/lib/mock/mock-repository";
import { DEMO_STORE_KEY, createMemoryStorage, type StorageIssue } from "@/lib/mock/storage";
import { priorityAssessmentSchema } from "@/lib/schemas";
import type { User } from "@/types";

const coordinator: User = { id: "u-coord-1", role: "coordinator", display_name: "Koordinator Demo" };
const officer: User = { id: "u-field-1", role: "field_officer", display_name: "Petugas Lapangan A" };

let clock = Date.parse("2026-10-14T01:00:00Z");
function fixedNow() {
  clock += 60_000;
  return new Date(clock);
}

function setup(storage = createMemoryStorage()) {
  return { storage, repo: createMockRepository({ storage, latencyMs: 0, now: fixedNow }) };
}

async function rejectsWith(promise: Promise<unknown>, code: RepositoryError["code"]) {
  await assert.rejects(promise, (error: unknown) => error instanceof RepositoryError && error.code === code);
}

test("Current Monitoring tidak pernah memakai GWT 2018–2019", async () => {
  const { repo } = setup();
  const bounds = repo.getModeBounds("CURRENT_MONITORING");
  const series = await repo.getGroundwater({ mode: "CURRENT_MONITORING", station_id: "BRG6", from: bounds.default_from, to: bounds.default_to });
  assert.equal(series.availability, "NOT_AVAILABLE");
  assert.equal(series.observations.length, 0);
  assert.match(series.notice ?? "", /tidak tersedia/);

  const hotspots = await repo.listHotspots({ mode: "CURRENT_MONITORING", from: bounds.min_date, to: bounds.max_date });
  assert.ok(hotspots.items.length > 0);
  assert.ok(hotspots.items.every((item) => item.mode === "CURRENT_MONITORING"));
  assert.notEqual(hotspots.last_synced_at, null);

  const priorities = await repo.listPriorities({ mode: "CURRENT_MONITORING", as_of: bounds.max_date });
  assert.ok(priorities.every((item) => item.missing_inputs.includes("GWT_CURRENT")));
  assert.ok(priorities.every((item) => item.input_snapshot.find((input) => input.key === "gwt_latest_m")?.value === null));
});

test("Historical Replay menghormati periode, as_of, dan gap", async () => {
  const { repo } = setup();
  const series = await repo.getGroundwater({ mode: "HISTORICAL_REPLAY", station_id: "BRG6", from: "2019-08-01", to: "2019-09-15" });
  assert.equal(series.availability, "AVAILABLE");
  assert.equal(series.observations.length, 46);
  assert.ok(series.observations.every((obs) => obs.observed_at >= "2019-08-01" && obs.observed_at <= "2019-09-15"));

  const hotspots = await repo.listHotspots({ mode: "HISTORICAL_REPLAY", from: "2019-09-09", to: "2019-09-15", area_id: "batanghari" });
  assert.ok(hotspots.items.length > 0);
  assert.ok(hotspots.items.every((item) => item.area_id === "batanghari" && item.observed_at.slice(0, 10) <= "2019-09-15"));

  const asOf = "2019-09-15";
  const priorities = await repo.listPriorities({ mode: "HISTORICAL_REPLAY", as_of: asOf });
  assert.equal(priorities.length, 6);
  for (const assessment of priorities) {
    assert.equal(priorityAssessmentSchema.safeParse(assessment).success, true);
    assert.equal(assessment.scientific_status, "heuristic_not_validated");
    for (const input of assessment.input_snapshot) {
      if (input.observed_at) assert.ok(input.observed_at.slice(0, 10) <= asOf, `${input.key} melewati as_of`);
    }
  }
  assert.ok(priorities.some((item) => item.decision === "REVIEW"));
});

test("data tidak tersedia menghasilkan INSUFFICIENT_DATA, bukan aman", async () => {
  const { repo } = setup();
  const priorities = await repo.listPriorities({ mode: "HISTORICAL_REPLAY", as_of: "2018-04-01" });
  assert.ok(priorities.every((item) => item.priority === "INSUFFICIENT_DATA" && item.decision === "INSUFFICIENT_DATA"));
});

test("output deterministik untuk input identik", async () => {
  const a = setup().repo;
  const b = setup().repo;
  const query = { mode: "HISTORICAL_REPLAY" as const, as_of: "2019-09-15" };
  assert.deepEqual(await a.listPriorities(query), await b.listPriorities(query));
  const hotspotQuery = { mode: "HISTORICAL_REPLAY" as const, from: "2019-07-01", to: "2019-10-31" };
  assert.deepEqual(await a.listHotspots(hotspotQuery), await b.listHotspots(hotspotQuery));
});

test("alur tugas → laporan → verifikasi tersimpan setelah reload", async () => {
  const { repo, storage } = setup();
  const hotspots = await repo.listHotspots({ mode: "HISTORICAL_REPLAY", from: "2019-09-09", to: "2019-09-15", area_id: "batanghari" });
  const hotspot = hotspots.items.at(-1)!;

  await rejectsWith(repo.createTask({ mode: "HISTORICAL_REPLAY", title: "Periksa titik", priority: "HIGH", assessment_id: null, hotspot_id: hotspot.id, area_id: "batanghari", assignee_id: null, note: null }, { actor: officer }), "FORBIDDEN");

  const task = await repo.createTask({ mode: "HISTORICAL_REPLAY", title: "Periksa titik baru", priority: "HIGH", assessment_id: null, hotspot_id: hotspot.id, area_id: "batanghari", assignee_id: "u-field-1", note: null }, { actor: coordinator });
  assert.equal(task.status, "ASSIGNED");
  await rejectsWith(repo.updateTask(task.id, { status: "VERIFIED" }, { actor: coordinator }), "ILLEGAL_TRANSITION");
  await rejectsWith(repo.updateTask(task.id, { status: "IN_PROGRESS" }, { actor: coordinator }), "FORBIDDEN");
  await repo.updateTask(task.id, { status: "IN_PROGRESS" }, { actor: officer });
  assert.equal((await repo.listHotspots({ mode: "HISTORICAL_REPLAY", from: "2019-09-09", to: "2019-09-15" })).items.find((item) => item.id === hotspot.id)?.verification_status, "IN_VERIFICATION");

  await rejectsWith(repo.createReport(task.id, { observed_at: "2019-09-15T03:00:00Z", result: "ACTIVE_FIRE_FOUND", note: "ok", evidence_url: null, is_simulation: false }, { actor: officer }), "VALIDATION");
  await repo.createReport(task.id, { observed_at: "2019-09-15T03:00:00Z", result: "ACTIVE_FIRE_FOUND", note: "SIMULASI: api kecil", evidence_url: null, is_simulation: true }, { actor: officer });
  await repo.updateTask(task.id, { status: "VERIFIED" }, { actor: coordinator });

  const reloaded = createMockRepository({ storage, latencyMs: 0 });
  const detail = await reloaded.getTask(task.id);
  assert.equal(detail.status, "VERIFIED");
  assert.equal(detail.reports.length, 1);
  assert.equal(detail.reports[0]?.is_simulation, true);
  assert.deepEqual(detail.history.map((change) => [change.to, change.actor_id]), [
    ["OPEN", "u-coord-1"], ["ASSIGNED", "u-coord-1"], ["IN_PROGRESS", "u-field-1"], ["SUBMITTED", "u-field-1"], ["VERIFIED", "u-coord-1"],
  ]);
  const verified = (await reloaded.listHotspots({ mode: "HISTORICAL_REPLAY", from: "2019-09-09", to: "2019-09-15" })).items.find((item) => item.id === hotspot.id);
  assert.equal(verified?.verification_status, "VERIFIED");
});

test("NEEDS_FOLLOWUP dapat ditugaskan ulang", async () => {
  const { repo } = setup();
  await repo.updateTask("task-2", { status: "NEEDS_FOLLOWUP", note: "Ambil foto tambahan" }, { actor: coordinator });
  const reassigned = await repo.updateTask("task-2", { status: "ASSIGNED", assignee_id: "u-field-1" }, { actor: coordinator });
  assert.equal(reassigned.status, "ASSIGNED");
  assert.equal(reassigned.assignee_id, "u-field-1");
});

test("laporan terverifikasi yang mendukung dapat menaikkan prioritas menjadi eskalasi", async () => {
  const { repo } = setup();
  const before = (await repo.listPriorities({ mode: "HISTORICAL_REPLAY", as_of: "2019-09-15", area_id: "kubu-raya" })).find((item) => item.target.id === "kubu-raya-b");
  assert.notEqual(before?.decision, "ESCALATE");
  await repo.updateTask("task-2", { status: "VERIFIED" }, { actor: coordinator });
  const after = (await repo.listPriorities({ mode: "HISTORICAL_REPLAY", as_of: "2019-09-15", area_id: "kubu-raya" })).find((item) => item.target.id === "kubu-raya-b");
  assert.equal(after?.decision, "ESCALATE");
  assert.ok(after?.reason_codes.includes("REPORT_SUPPORTS_FIRE"));
});

test("localStorage rusak dipulihkan ke seed tanpa crash", async () => {
  const storage = createMemoryStorage();
  storage.setItem(DEMO_STORE_KEY, "{bukan json");
  const issues: StorageIssue[] = [];
  const repo = createMockRepository({ storage, latencyMs: 0, onStorageIssue: (issue) => issues.push(issue) });
  const tasks = await repo.listTasks();
  assert.deepEqual(issues, ["RECOVERED"]);
  assert.equal(tasks.length, 2);

  storage.setItem(DEMO_STORE_KEY, JSON.stringify({ version: 1, next_id: 1, tasks: [{ id: "x" }], reports: [] }));
  const issues2: StorageIssue[] = [];
  await createMockRepository({ storage, latencyMs: 0, onStorageIssue: (issue) => issues2.push(issue) }).listTasks();
  assert.deepEqual(issues2, ["RECOVERED"]);
});

test("permintaan yang dibatalkan ditolak dengan ABORTED", async () => {
  const repo = createMockRepository({ storage: createMemoryStorage(), latencyMs: 50 });
  const controller = new AbortController();
  const pending = repo.listStations({ signal: controller.signal });
  controller.abort();
  await rejectsWith(pending, "ABORTED");
});

test("ML mock tidak mengarang metrik", async () => {
  const { repo } = setup();
  const metrics = await repo.getMlMetrics();
  assert.equal(metrics.status, "NOT_AVAILABLE");
  assert.equal((await repo.forecastGroundwater({ station_id: "BRG6", date: "2019-09-15" })).status, "REJECTED");
});

test("ringkasan dashboard konsisten dengan operasi domain", async () => {
  const { repo } = setup();
  const query = { mode: "HISTORICAL_REPLAY" as const, from: "2019-08-17", to: "2019-09-15", as_of: "2019-09-15", area_id: null };
  const summary = await repo.getDashboardSummary(query);
  const hotspots = await repo.listHotspots(query);
  assert.equal(summary.hotspots.total, hotspots.total, "total memakai total server, bukan items.length");
  assert.equal(summary.hotspots.unverified_scope, hotspots.total > hotspots.items.length ? "PAGE" : "ALL");
  assert.equal(Object.values(summary.priorities).reduce((sum, value) => sum + value, 0), 6);
  assert.equal(summary.tasks.awaiting_review, 1);
  assert.equal(summary.groundwater.availability, "AVAILABLE");
  assert.ok(summary.groundwater.missing_days > 0);
  assert.ok(summary.activity.length > 0);

  const current = await repo.getDashboardSummary({ ...query, mode: "CURRENT_MONITORING", from: "2026-10-06", to: "2026-10-12", as_of: "2026-10-12" });
  assert.equal(current.groundwater.availability, "NOT_AVAILABLE");
  assert.equal(current.tasks.awaiting_review, 0, "tugas historis tidak muncul di mode terkini");
});

test("hotspot mock: pagination dan urutan mengikuti backend", async () => {
  const { repo } = setup();
  const query = { mode: "HISTORICAL_REPLAY" as const, from: "2019-07-01", to: "2019-10-31" };
  const all = await repo.listHotspots({ ...query, limit: 1000 });
  assert.ok(all.total > 10);
  const first = await repo.listHotspots({ ...query, limit: 5, offset: 0 });
  const second = await repo.listHotspots({ ...query, limit: 5, offset: 5 });
  assert.equal(first.total, all.total);
  assert.equal(second.total, all.total);
  assert.deepEqual([first.limit, first.offset, second.offset], [5, 0, 5]);
  assert.equal(first.items.length, 5);
  assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 10, "halaman tidak tumpang tindih");
  const ordered = [...first.items, ...second.items];
  assert.ok(ordered.every((item, index) => index === 0 || ordered[index - 1]!.observed_at >= item.observed_at), "waktu akuisisi turun");
  assert.equal((await repo.listHotspots(query)).limit, 200, "limit default 200");
  await rejectsWith(repo.listHotspots({ ...query, limit: 1001 }), "VALIDATION");
  await rejectsWith(repo.listHotspots({ ...query, offset: -1 }), "VALIDATION");
  const snpp = await repo.listHotspots({ ...query, satellite: "N", limit: 1000 });
  assert.ok(snpp.total > 0 && snpp.total < all.total, "filter satellite memakai kode seperti backend");
  assert.ok(snpp.items.every((item) => item.satellite === "N"));
});

test("mock: status sync FIRMS berlabel DEMO dan sync manual ditolak (tidak berpura-pura live)", async () => {
  const repo = createMockRepository({ storage: createMemoryStorage() });
  const status = await repo.getHotspotSyncStatus();
  assert.equal(status.length, 2);
  assert.ok(status.every((item) => item.area_id === "indonesia"));
  assert.ok(status.every((item) => item.status === "SUCCESS"));
  const coordinator = (await repo.listUsers()).find((user) => user.role === "coordinator")!;
  await assert.rejects(repo.syncHotspots({ area_id: "batanghari", source_product: "VIIRS_SNPP_NRT", day_range: 3 }, { actor: coordinator }), /hanya tersedia saat terhubung ke server/);
});


test("mock: seluruh marker peta konsisten dengan halaman daftar", async () => {
  const repo = createMockRepository({ storage: createMemoryStorage() });
  const query = { mode: "HISTORICAL_REPLAY" as const, from: "2019-07-01", to: "2019-10-31" };
  const map = await repo.getHotspotMap(query);
  const page = await repo.listHotspots({ ...query, limit: 100, offset: 100 });
  assert.ok(map.items.length > 100);
  assert.deepEqual(map.items.slice(100, 200).map((point) => point.id), page.items.map((point) => point.id));
  assert.equal(map.items[100]!.list_offset, 100);
});

test("mock signIn: hanya akun demo yang dikenal", async () => {
  const repo = createMockRepository({ storage: createMemoryStorage(), latencyMs: 0 });
  const [first] = await repo.listUsers();
  assert.deepEqual(await repo.signIn(first!), first);
  await assert.rejects(repo.signIn({ id: "palsu", role: "coordinator", display_name: "X" }), /tidak dikenal/);
});
