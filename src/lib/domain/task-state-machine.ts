import type { InspectionTask, TaskStatus, TaskStatusChange, User, UserRole } from "@/types";

/** Alur PRD: OPEN → ASSIGNED → IN_PROGRESS → SUBMITTED → VERIFIED | DISMISSED | NEEDS_FOLLOWUP; NEEDS_FOLLOWUP → ASSIGNED. */
export const TASK_TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["SUBMITTED"],
  SUBMITTED: ["VERIFIED", "DISMISSED", "NEEDS_FOLLOWUP"],
  NEEDS_FOLLOWUP: ["ASSIGNED"],
  VERIFIED: [],
  DISMISSED: [],
};

/** Peran yang boleh melakukan transisi menuju status tujuan. */
const TRANSITION_ROLE: Readonly<Record<TaskStatus, UserRole | null>> = {
  OPEN: null,
  ASSIGNED: "coordinator",
  IN_PROGRESS: "field_officer",
  SUBMITTED: "field_officer",
  VERIFIED: "coordinator",
  DISMISSED: "coordinator",
  NEEDS_FOLLOWUP: "coordinator",
};

export const TERMINAL_STATUSES: readonly TaskStatus[] = ["VERIFIED", "DISMISSED"];
export const ACTIVE_STATUSES: readonly TaskStatus[] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "NEEDS_FOLLOWUP"];

export type TransitionCheck = { ok: true } | { ok: false; code: "ILLEGAL_TRANSITION" | "FORBIDDEN"; reason: string };

export interface TransitionOptions {
  /** SUBMITTED hanya dapat dicapai melalui pengiriman laporan. */
  viaReport?: boolean;
  /** Assignee setelah perubahan (dipakai saat menugaskan). */
  nextAssigneeId?: string | null;
}

export function canTransition(task: Pick<InspectionTask, "status" | "assignee_id">, to: TaskStatus, actor: User, options: TransitionOptions = {}): TransitionCheck {
  if (!TASK_TRANSITIONS[task.status].includes(to)) {
    return { ok: false, code: "ILLEGAL_TRANSITION", reason: `Transisi ${task.status} → ${to} tidak diizinkan.` };
  }
  const role = TRANSITION_ROLE[to];
  if (role !== actor.role) {
    return { ok: false, code: "FORBIDDEN", reason: role === "coordinator" ? "Hanya koordinator yang dapat melakukan perubahan ini." : "Hanya petugas lapangan yang dapat melakukan perubahan ini." };
  }
  if (to === "SUBMITTED" && !options.viaReport) {
    return { ok: false, code: "ILLEGAL_TRANSITION", reason: "Status SUBMITTED hanya dapat dicapai dengan mengirim laporan." };
  }
  if (to === "ASSIGNED") {
    const assignee = options.nextAssigneeId === undefined ? task.assignee_id : options.nextAssigneeId;
    if (!assignee) return { ok: false, code: "ILLEGAL_TRANSITION", reason: "Pilih petugas sebelum menugaskan." };
  }
  if ((to === "IN_PROGRESS" || to === "SUBMITTED") && task.assignee_id !== actor.id) {
    return { ok: false, code: "FORBIDDEN", reason: "Hanya petugas yang ditugaskan yang dapat memperbarui tugas ini." };
  }
  return { ok: true };
}

/**
 * Transisi yang dapat dilakukan aktor saat ini, untuk menampilkan tombol yang relevan saja.
 * SUBMITTED tidak disertakan karena dicapai lewat form laporan; ASSIGNED tetap ditampilkan
 * walau assignee belum dipilih karena UI meminta pilihan petugas pada langkah tersebut.
 */
export function availableTransitions(task: Pick<InspectionTask, "status" | "assignee_id">, actor: User): TaskStatus[] {
  return TASK_TRANSITIONS[task.status].filter((to) => {
    if (to === "SUBMITTED") return false;
    const options = to === "ASSIGNED" ? { nextAssigneeId: task.assignee_id ?? actor.id } : {};
    return canTransition(task, to, actor, options).ok;
  });
}

/** Laporan dapat dikirim oleh petugas yang ditugaskan selama tugas berstatus IN_PROGRESS. */
export function canSubmitReport(task: Pick<InspectionTask, "status" | "assignee_id">, actor: User): TransitionCheck {
  return canTransition(task, "SUBMITTED", actor, { viaReport: true });
}

export function isTerminal(status: TaskStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Riwayat urut waktu; pada waktu yang sama, entri pembuatan (tanpa status asal) didahulukan. */
export function orderedHistory(history: readonly TaskStatusChange[]): TaskStatusChange[] {
  return history
    .map((change, index) => ({ change, index }))
    .sort((a, b) => Date.parse(a.change.at) - Date.parse(b.change.at) || Number(a.change.from !== null) - Number(b.change.from !== null) || a.index - b.index)
    .map(({ change }) => change);
}
