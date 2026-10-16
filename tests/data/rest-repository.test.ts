import assert from "node:assert/strict";
import test from "node:test";
import { RepositoryError } from "@/lib/api/errors";
import { createRestRepository } from "@/lib/api/rest-repository";
import { GROUNDWATER } from "@/lib/mock/fixtures";
import type { User } from "@/types";

const actor: User = { id: "u-coord-1", role: "coordinator", display_name: "Koordinator" };

interface Call { url: URL; init: RequestInit }

function fakeFetch(handler: (url: URL, init: RequestInit) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
  const repo = createRestRepository({
    baseUrl: "http://api.test/api/v1/", fetch: fetchImpl, today: () => "2026-10-12", now: () => Date.parse("2026-10-12T06:30:15.500Z"),
    authTokens: { coordinator: "coord-token", field_officer: "field-token" },
  });
  return { calls, repo };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function rejectsWith(promise: Promise<unknown>, code: RepositoryError["code"]) {
  await assert.rejects(promise, (error: unknown) => error instanceof RepositoryError && error.code === code);
}

/** Item hotspot dalam bentuk respons backend (`GET /api/v1/hotspots`). */
function apiHotspot(overrides: Record<string, unknown> = {}) {
  return {
    id: "0079a997-afdc-45dd-a955-1c6af04fc933", external_key: "k-1", latitude: -1.37, longitude: 103.85,
    acquired_at: "2026-10-12T05:10:00Z", source_product: "VIIRS_SNPP_NRT", sensor: "VIIRS", satellite: "N",
    frp: 4.01, confidence_raw: "n", verification_status: "UNVERIFIED", source: "FIRMS", quality_flag: "VALID",
    mode: "CURRENT_MONITORING", last_synced_at: "2026-10-12T08:15:00Z", ...overrides,
  };
}

test("hotspot: Terkini memakai cakupan nasional meskipun filter wilayah lama tersimpan", async () => {
  const { repo, calls } = fakeFetch(() => json({ items: [apiHotspot()], total: 7, limit: 1, offset: 3 }));
  const result = await repo.listHotspots({ mode: "CURRENT_MONITORING", from: "2026-10-06", to: "2026-10-12", area_id: "batanghari", limit: 1, offset: 3 });
  assert.deepEqual([result.items.length, result.total, result.limit, result.offset], [1, 7, 1, 3]);
  assert.equal(result.mode, "CURRENT_MONITORING");
  const url = calls[0]!.url;
  assert.equal(url.pathname, "/api/v1/hotspots");
  assert.equal(url.searchParams.get("mode"), "CURRENT_MONITORING");
  assert.equal(url.searchParams.get("bbox"), "94,-11.5,141.5,6.5");
  assert.equal(url.searchParams.get("limit"), "1");
  assert.equal(url.searchParams.get("offset"), "3");
});

test("hotspot dengan mode berbeda ditolak sebagai payload tidak valid", async () => {
  const { repo } = fakeFetch(() => json({ items: [apiHotspot({ mode: "HISTORICAL_REPLAY" })], total: 1, limit: 200, offset: 0 }));
  await rejectsWith(repo.listHotspots({ mode: "CURRENT_MONITORING", from: "2026-10-06", to: "2026-10-12" }), "INVALID_PAYLOAD");
});

test("payload tidak sesuai schema → INVALID_PAYLOAD", async () => {
  const { repo } = fakeFetch(() => json([{ id: "BRG6" }]));
  await rejectsWith(repo.listStations(), "INVALID_PAYLOAD");
  const { repo: broken } = fakeFetch(() => new Response("<html>", { status: 200 }));
  await rejectsWith(broken.listStations(), "INVALID_PAYLOAD");
});

test("Current Monitoring: observasi GWT lama dari server disembunyikan", async () => {
  const stationId = "3628bc1b-491e-4cb6-a5c6-55215761981f";
  const old = (GROUNDWATER.get("BRG6") ?? []).slice(0, 5).map((obs) => ({
    id: obs.id, station_id: stationId, observed_date: obs.observed_at, observed_at: `${obs.observed_at}T00:00:00Z`, gwt_m: obs.gwt_m,
    quality_flag: obs.quality_flag, source: "mmc1.xlsx", source_id: "src-1", source_sha256: "abc", mode: "CURRENT_MONITORING",
  }));
  const { repo } = fakeFetch(() => json(old));
  const series = await repo.getGroundwater({ mode: "CURRENT_MONITORING", station_id: stationId, from: "2026-10-06", to: "2026-10-12" });
  assert.equal(series.availability, "NOT_AVAILABLE");
  assert.equal(series.observations.length, 0);
});

test("status HTTP dipetakan ke kode error dengan detail FastAPI", async () => {
  const { repo } = fakeFetch(() => json({ detail: "Transisi OPEN → VERIFIED tidak diizinkan." }, 409));
  await assert.rejects(repo.updateTask("task-1", { status: "VERIFIED" }, { actor }), (error: unknown) => error instanceof RepositoryError && error.code === "ILLEGAL_TRANSITION" && error.message.includes("OPEN"));
  const { repo: notFound } = fakeFetch(() => json({ detail: "Not found" }, 404));
  await rejectsWith(notFound.getTask("x"), "NOT_FOUND");
  const { repo: server } = fakeFetch(() => json({}, 500));
  await rejectsWith(server.listStations(), "HTTP");
});

test("mutasi memvalidasi input sebelum dikirim dan memakai Bearer token sesuai peran", async () => {
  const { repo, calls } = fakeFetch(() => json({}, 500));
  await rejectsWith(repo.createTask({ mode: "HISTORICAL_REPLAY", title: "x", priority: "HIGH", assessment_id: null, hotspot_id: null, area_id: null, assignee_id: null, note: null }, { actor }), "VALIDATION");
  assert.equal(calls.length, 0, "input invalid tidak dikirim");
  await rejectsWith(repo.updateTask("task-1", { status: "ASSIGNED", assignee_id: "u-field-1" }, { actor }), "HTTP");
  assert.equal(calls[0]?.init.method, "PATCH");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer coord-token");
  assert.equal(headers["X-Actor-Id"], undefined, "identitas buatan klien tidak dikirim");
  const officer: User = { id: "u-field-1", role: "field_officer", display_name: "Petugas" };
  await rejectsWith(repo.createReport("task-1", { observed_at: "2026-10-12T05:00:00Z", result: "NO_FIRE_FOUND", note: "Aman terkendali", evidence_url: null, is_simulation: true }, { actor: officer }), "HTTP");
  assert.equal((calls[1]?.init.headers as Record<string, string>).Authorization, "Bearer field-token");
  assert.equal((calls[1]?.init.headers as Record<string, string>)["X-Actor-Id"], undefined);
});

test("token peran belum dikonfigurasi → FORBIDDEN tanpa request", async () => {
  const calls: unknown[] = [];
  const repo = createRestRepository({ baseUrl: "http://api.test/api/v1", fetch: (async () => { calls.push(1); return json({}); }) as typeof fetch });
  await rejectsWith(repo.updateTask("task-1", { status: "VERIFIED" }, { actor }), "FORBIDDEN");
  assert.equal(calls.length, 0);
});

function apiPriority(overrides: Record<string, unknown> = {}) {
  return {
    id: "740f2748-0f3d-5b03-8df6-b4307204a6c4", area_id: "batanghari", decision: "REVIEW", mode: "HISTORICAL_REPLAY",
    as_of: "2019-08-31T23:59:59Z", priority: "HIGH", explanation: "Anomali termal memerlukan verifikasi; bukan konfirmasi kebakaran.",
    reason_codes: ["HOTSPOT_REPEATED_3_DAYS", "HOTSPOT_REQUIRES_VERIFICATION"], missing_inputs: ["CHIRPS_RAINFALL", "FIELD_VERIFICATION"],
    input_snapshot: {
      area_id: "batanghari", window_start: "2019-08-25T00:00:00+00:00", window_end: "2019-08-31T23:59:59+00:00",
      gwt_trends: [{ station: "BRG5", delta_m: -0.03, observations: [{ id: "o1", date: "2019-08-25", value_m: -0.945, quality: "VALID" }, { id: "o2", date: "2019-08-31", value_m: -0.975, quality: "VALID" }] }],
      hotspots: [
        { id: "h1", acquired_at: "2019-08-25T14:08:00+07:00", reviewed: false },
        { id: "h2", acquired_at: "2019-08-27T01:00:00+07:00", reviewed: true },
        { id: "h3", acquired_at: "2019-08-30T13:00:00+07:00", reviewed: false },
      ],
      supporting_reports: [], verification_reports: [], absence_is_not_safety: true,
    },
    rule_version: "inspection-rules-1.0", recommended_actions: ["Buat tugas inspeksi dan verifikasi indikasi hotspot."],
    scientific_status: "heuristic_not_validated", ...overrides,
  };
}

test("priorities: cutoff UTC akhir hari, snapshot objek dipetakan ke indikator", async () => {
  const { repo, calls } = fakeFetch(() => json([apiPriority()]));
  const [item] = await repo.listPriorities({ mode: "HISTORICAL_REPLAY", as_of: "2019-08-31" });
  assert.equal(calls[0]?.url.searchParams.get("as_of"), "2019-08-31T23:59:59Z");
  assert.equal(item?.as_of, "2019-08-31");
  assert.deepEqual(item?.target, { type: "AREA", id: "batanghari", label: "Batanghari, Jambi" });
  const value = (key: string) => item?.input_snapshot.find((input) => input.key === key)?.value;
  assert.equal(value("HOTSPOT_COUNT"), 3);
  assert.equal(value("HOTSPOT_UNREVIEWED"), 2);
  assert.equal(value("HOTSPOT_DAYS"), 3, "hari dihitung dalam UTC");
  assert.equal(value("GWT_TREND_BRG5"), -0.03);
  assert.equal(item?.raw_input_snapshot?.absence_is_not_safety, true, "snapshot asli tetap tersedia");
});

test("priorities: cutoff hari ini tidak boleh di masa depan; mode berbeda ditolak", async () => {
  const { repo, calls } = fakeFetch(() => json([apiPriority({ mode: "CURRENT_MONITORING", as_of: "2026-10-12T06:30:15Z" })]));
  await repo.listPriorities({ mode: "CURRENT_MONITORING", as_of: "2026-10-12" });
  assert.equal(calls[0]?.url.searchParams.get("as_of"), "2026-10-12T06:30:15Z");
  const { repo: wrong } = fakeFetch(() => json([apiPriority()]));
  await rejectsWith(wrong.listPriorities({ mode: "CURRENT_MONITORING", as_of: "2026-10-12" }), "INVALID_PAYLOAD");
});

test("jaringan gagal → NETWORK, dibatalkan → ABORTED", async () => {
  const { repo } = fakeFetch(() => { throw new TypeError("fetch failed"); });
  await rejectsWith(repo.listStations(), "NETWORK");
  const controller = new AbortController();
  controller.abort();
  const { repo: aborted } = fakeFetch(() => { throw new DOMException("aborted", "AbortError"); });
  await rejectsWith(aborted.listStations({ signal: controller.signal }), "ABORTED");
});

test("health memanggil /health pada origin API", async () => {
  const { repo, calls } = fakeFetch(() => json({ status: "ok" }));
  assert.deepEqual(await repo.health(), { status: "ok", detail: "ok" });
  assert.equal(calls[0]?.url.toString(), "http://api.test/health");
});

test("sync FIRMS: status dibaca tanpa token; sync manual memakai Bearer koordinator dan memetakan 429", async () => {
  const status = [{ area_id: "batanghari", source_product: "VIIRS_SNPP_NRT", status: "SUCCESS", last_attempt: { id: "a1", status: "SUCCESS", rows_received: 11 }, last_successful_at: "2026-10-14T23:00:00Z" }];
  const { repo, calls } = fakeFetch((url) => (url.pathname.endsWith("/sync-status") ? json(status) : json({ detail: "Cooldown aktif." }, 429)));
  const [target] = await repo.getHotspotSyncStatus();
  assert.equal(target?.status, "SUCCESS");
  assert.equal((calls[0]?.init.headers as Record<string, string>).Authorization, undefined);
  await assert.rejects(repo.syncHotspots({ area_id: "batanghari", source_product: "VIIRS_SNPP_NRT", day_range: 3 }, { actor }), (error: unknown) => error instanceof RepositoryError && error.status === 429 && error.message === "Cooldown aktif.");
  assert.equal(calls[1]?.url.pathname, "/api/v1/admin/hotspots/sync");
  assert.equal((calls[1]?.init.headers as Record<string, string>).Authorization, "Bearer coord-token");
  await rejectsWith(repo.syncHotspots({ area_id: "batanghari", source_product: "VIIRS_SNPP_NRT", day_range: 9 }, { actor }), "VALIDATION");
});


test("peta memuat marker Kalimantan di luar halaman pertama daftar", async () => {
  const markers = Array.from({ length: 151 }, (_, index) => ({
    id: `point-${index}`, latitude: -2, longitude: index === 150 ? 114 : 102,
    observed_at: "2026-10-15T06:00:00Z", frp_mw: 1,
    verification_status: "UNVERIFIED", list_offset: index,
  }));
  const { repo, calls } = fakeFetch(() => json({ mode: "CURRENT_MONITORING", items: markers }));
  const data = await repo.getHotspotMap({ mode: "CURRENT_MONITORING", from: "2026-10-13", to: "2026-10-15", area_id: "batanghari", satellite: "N20" });
  assert.equal(data.items.length, 151);
  assert.equal(data.items[150]!.longitude, 114);
  assert.equal(data.items[150]!.list_offset, 150);
  assert.equal(calls[0]!.url.pathname, "/api/v1/hotspots/map");
  assert.equal(calls[0]!.url.searchParams.get("bbox"), "94,-11.5,141.5,6.5");
  assert.equal(calls[0]!.url.searchParams.get("satellite"), "N20");
  assert.equal(calls[0]!.url.searchParams.has("limit"), false);
  assert.equal(calls[0]!.url.searchParams.has("offset"), false);
});

test("signIn: identitas diverifikasi lewat GET /auth/me dengan Bearer sesuai peran", async () => {
  const me: User = { id: "00000000-0000-4000-8000-000000000001", role: "coordinator", display_name: "Koordinator Demo" };
  const { repo, calls } = fakeFetch(() => json(me));
  assert.deepEqual(await repo.signIn({ ...me, display_name: "Dari daftar" }), me, "nama dan ID mengikuti server");
  assert.equal(calls[0]?.url.pathname, "/api/v1/auth/me");
  assert.equal((calls[0]?.init.headers as Record<string, string>).Authorization, "Bearer coord-token");
  const officer: User = { id: "f", role: "field_officer", display_name: "Petugas" };
  await rejectsWith(repo.signIn(officer), "FORBIDDEN"); // server mengembalikan koordinator
  const { repo: denied } = fakeFetch(() => json({ detail: "Invalid token" }, 401));
  await rejectsWith(denied.signIn(actor), "FORBIDDEN");
});
