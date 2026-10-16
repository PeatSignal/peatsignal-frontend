import assert from "node:assert/strict";
import test from "node:test";
import { COMMUNITY_ALERTS, COMMUNITY_STORE_KEY, communityAlertSchema, citizenReportSchema, emptyCommunityStore, loadCommunityStore, saveCommunityStore, validateReport } from "@/lib/community";
import { createMemoryStorage } from "@/lib/mock/storage";
import { AREAS, findArea, isInBbox } from "@/lib/domain/areas";
import { createMockRepository } from "@/lib/mock/mock-repository";
import { canSubmitReport, availableTransitions } from "@/lib/domain/task-state-machine";

const input = { area_id: "batanghari", category: "FIRE", longitude: 103.45, latitude: -1.75, observed_at: "2026-10-12T07:00:00Z", description: "Asap terlihat dari kejauhan di lahan contoh.", contact: "" };

test("indikasi masyarakat valid, sintetis, dan berada di kedua wilayah demo", () => {
  for (const area of AREAS) {
    const alerts = COMMUNITY_ALERTS.filter((alert) => alert.area_id === area.id);
    assert.ok(alerts.some((alert) => alert.kind === "HOTSPOT"));
    assert.ok(alerts.some((alert) => alert.kind === "LAND_CHANGE"));
  }
  for (const alert of COMMUNITY_ALERTS) {
    assert.equal(communityAlertSchema.safeParse(alert).success, true);
    assert.match(alert.source, /DEMO/);
    assert.equal(alert.is_simulation, true);
    assert.equal(isInBbox(alert.longitude, alert.latitude, findArea(alert.area_id)!.bbox), true);
  }
});

test("validasi laporan membatasi lokasi, waktu, kategori, dan deskripsi", () => {
  const now = new Date("2026-10-16T00:00:00Z");
  assert.equal(validateReport(input, now).description, input.description);
  for (const invalid of [{ ...input, longitude: 0 }, { ...input, observed_at: "2027-01-01T00:00:00Z" }, { ...input, observed_at: "rusak" }, { ...input, description: "singkat" }, { ...input, description: "x".repeat(501) }, { ...input, category: "INVALID" }]) {
    assert.throws(() => validateReport(invalid, now));
  }
});

test("laporan dan status baca persisten; data rusak dipulihkan; kegagalan simpan dilaporkan", () => {
  const storage = createMemoryStorage();
  const report = citizenReportSchema.parse({ ...input, id: "report-1", submitted_at: "2026-10-16T00:00:00Z", status: "SUBMITTED", is_simulation: true });
  const store = { ...emptyCommunityStore(), reports: [report], read_alert_ids: [COMMUNITY_ALERTS[0]!.id] };
  assert.equal(saveCommunityStore(storage, store), true);
  assert.deepEqual(loadCommunityStore(storage, () => assert.fail()), store);
  storage.setItem(COMMUNITY_STORE_KEY, "{rusak");
  let issues = 0;
  assert.deepEqual(loadCommunityStore(storage, () => issues++), emptyCommunityStore());
  assert.equal(issues, 1);
  loadCommunityStore(storage, () => assert.fail("data rusak harus sudah dipulihkan"));
  assert.equal(saveCommunityStore(null, store), false);
  assert.equal(saveCommunityStore({ ...storage, setItem: () => { throw new Error("quota"); } }, store), false);
});

test("akun masyarakat dapat masuk mock tetapi tidak mengubah tugas operasional", async () => {
  const repository = createMockRepository();
  const user = (await repository.listUsers()).find((user) => user.role === "community")!;
  assert.equal((await repository.signIn(user)).role, "community");
  const task = { status: "IN_PROGRESS" as const, assignee_id: user.id };
  assert.equal(canSubmitReport(task, user).ok, false);
  assert.deepEqual(availableTransitions({ status: "OPEN", assignee_id: null }, user), []);
});
