import assert from "node:assert/strict";
import test from "node:test";
import { availableTransitions, canSubmitReport, canTransition, orderedHistory } from "@/lib/domain/task-state-machine";
import type { User } from "@/types";

const coordinator: User = { id: "c1", role: "coordinator", display_name: "K" };
const officer: User = { id: "f1", role: "field_officer", display_name: "P" };
const otherOfficer: User = { id: "f2", role: "field_officer", display_name: "Q" };

test("alur lengkap PRD diizinkan untuk peran yang benar", () => {
  assert.equal(canTransition({ status: "OPEN", assignee_id: null }, "ASSIGNED", coordinator, { nextAssigneeId: "f1" }).ok, true);
  assert.equal(canTransition({ status: "ASSIGNED", assignee_id: "f1" }, "IN_PROGRESS", officer).ok, true);
  assert.equal(canSubmitReport({ status: "IN_PROGRESS", assignee_id: "f1" }, officer).ok, true);
  for (const to of ["VERIFIED", "DISMISSED", "NEEDS_FOLLOWUP"] as const) {
    assert.equal(canTransition({ status: "SUBMITTED", assignee_id: "f1" }, to, coordinator).ok, true);
  }
  assert.equal(canTransition({ status: "NEEDS_FOLLOWUP", assignee_id: "f1" }, "ASSIGNED", coordinator).ok, true);
});

test("transisi ilegal dan peran salah ditolak dengan kode yang jelas", () => {
  const skip = canTransition({ status: "OPEN", assignee_id: null }, "VERIFIED", coordinator);
  assert.deepEqual(skip.ok ? null : skip.code, "ILLEGAL_TRANSITION");
  const terminal = canTransition({ status: "VERIFIED", assignee_id: "f1" }, "ASSIGNED", coordinator);
  assert.equal(terminal.ok, false);
  const wrongRole = canTransition({ status: "SUBMITTED", assignee_id: "f1" }, "VERIFIED", officer);
  assert.deepEqual(wrongRole.ok ? null : wrongRole.code, "FORBIDDEN");
  const wrongOfficer = canTransition({ status: "ASSIGNED", assignee_id: "f1" }, "IN_PROGRESS", otherOfficer);
  assert.deepEqual(wrongOfficer.ok ? null : wrongOfficer.code, "FORBIDDEN");
  assert.equal(canTransition({ status: "OPEN", assignee_id: null }, "ASSIGNED", coordinator).ok, false, "menugaskan tanpa petugas");
  assert.equal(canTransition({ status: "IN_PROGRESS", assignee_id: "f1" }, "SUBMITTED", officer).ok, false, "SUBMITTED hanya lewat laporan");
});

test("availableTransitions hanya menampilkan aksi yang boleh dilakukan aktor", () => {
  assert.deepEqual(availableTransitions({ status: "OPEN", assignee_id: null }, coordinator), ["ASSIGNED"]);
  assert.deepEqual(availableTransitions({ status: "OPEN", assignee_id: null }, officer), []);
  assert.deepEqual(availableTransitions({ status: "ASSIGNED", assignee_id: "f1" }, officer), ["IN_PROGRESS"]);
  assert.deepEqual(availableTransitions({ status: "IN_PROGRESS", assignee_id: "f1" }, officer), []);
  assert.deepEqual(availableTransitions({ status: "SUBMITTED", assignee_id: "f1" }, coordinator), ["VERIFIED", "DISMISSED", "NEEDS_FOLLOWUP"]);
});

test("orderedHistory: urut waktu, entri pembuatan didahulukan bila waktunya sama", () => {
  const at = "2026-10-15T03:00:00Z";
  const later = "2026-10-15T03:05:00Z";
  const history = [
    { from: "OPEN" as const, to: "ASSIGNED" as const, actor_id: "c", actor_role: "coordinator" as const, at, note: null },
    { from: "ASSIGNED" as const, to: "IN_PROGRESS" as const, actor_id: "f", actor_role: "field_officer" as const, at: later, note: null },
    { from: null, to: "OPEN" as const, actor_id: "c", actor_role: "coordinator" as const, at, note: null },
  ];
  assert.deepEqual(orderedHistory(history).map((change) => change.to), ["OPEN", "ASSIGNED", "IN_PROGRESS"]);
});
