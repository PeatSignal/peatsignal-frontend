import assert from "node:assert/strict";
import test from "node:test";
import { buildActivity } from "@/lib/domain/dashboard";
import type { InspectionTask } from "@/types";

const at = "2026-10-15T03:00:00Z";
const task: InspectionTask = {
  id: "t1", mode: "HISTORICAL_REPLAY", title: "Periksa titik", status: "IN_PROGRESS", priority: "HIGH",
  assessment_id: "a1", hotspot_id: null, area_id: "batanghari", assignee_id: "f1", created_by: "c1",
  created_at: at, updated_at: "2026-10-15T03:05:00Z", note: null, is_simulation: true,
  // Urutan seperti respons backend: penugasan dikirim sebelum entri pembuatan dengan waktu yang sama.
  history: [
    { from: "OPEN", to: "ASSIGNED", actor_id: "c1", actor_role: "coordinator", at, note: null },
    { from: null, to: "OPEN", actor_id: "c1", actor_role: "coordinator", at, note: null },
    { from: "ASSIGNED", to: "IN_PROGRESS", actor_id: "f1", actor_role: "field_officer", at: "2026-10-15T03:05:00Z", note: null },
  ],
};

test("buildActivity: terbaru dulu; pada waktu sama, penugasan tampil setelah pembuatan", () => {
  const activity = buildActivity([task]);
  assert.deepEqual(activity.map((item) => [item.kind, item.status]), [
    ["TASK_STATUS", "IN_PROGRESS"],
    ["TASK_STATUS", "ASSIGNED"],
    ["TASK_CREATED", "OPEN"],
  ]);
});
