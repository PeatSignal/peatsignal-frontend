"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, History } from "lucide-react";
import { useActor } from "@/components/providers/actor-context";
import { useTask } from "@/components/providers/data-hooks";
import { ErrorState } from "@/components/shared/async-states";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";
import { findArea } from "@/lib/domain/areas";
import { reportResultLabels, roleLabels, taskStatusLabels } from "@/lib/domain/labels";
import { orderedHistory } from "@/lib/domain/task-state-machine";
import { formatDateTime } from "@/lib/format";
import type { InspectionTaskDetail, User } from "@/types";
import { TaskActions } from "./task-actions";
import { PriorityBadge, TaskStatusBadge } from "./task-badges";

function userName(users: readonly User[], id: string | null, fallback = "—"): string {
  if (!id) return fallback;
  return users.find((user) => user.id === id)?.display_name ?? "Pengguna tidak dikenal";
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

function DetailBody({ task }: { task: InspectionTaskDetail }) {
  const { users } = useActor();
  const area = findArea(task.area_id);
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.is_simulation && <DemoBadge report />}
        </div>
        <h2 className="text-xl font-semibold tracking-tight" id="task-detail-title">{task.title}</h2>
        {task.note && <p className="text-sm leading-6 text-muted-foreground">{task.note}</p>}
      </div>

      <dl className="grid gap-3 rounded-xl border bg-card p-4 min-[480px]:grid-cols-2">
        <Fact label="Wilayah">{area?.label ?? task.area_id ?? "Belum tercatat"}</Fact>
        <Fact label="Petugas">{userName(users, task.assignee_id, "Belum ditugaskan")}</Fact>
        <Fact label="Dibuat">{formatDateTime(task.created_at)} · {userName(users, task.created_by)}</Fact>
        <Fact label="Terakhir diperbarui">{formatDateTime(task.updated_at)}</Fact>
        <Fact label="Dasar tugas">
          {task.assessment_id ? <Link className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline" href="/priorities">Prioritas pemeriksaan<ExternalLink className="size-3.5" aria-hidden="true" /></Link> : "Anomali panas"}
        </Fact>
      </dl>

      <TaskActions task={task} />

      <section aria-labelledby="reports-title" className="space-y-3">
        <h3 id="reports-title" className="text-sm font-semibold">Laporan lapangan ({task.reports.length})</h3>
        {task.reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada laporan.</p>
        ) : (
          <ul className="space-y-3">
            {[...task.reports].sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at)).map((report) => (
              <li key={report.id} className="space-y-1.5 rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{reportResultLabels[report.result]}</p>
                  {report.is_simulation && <DemoBadge report />}
                </div>
                <p className="text-sm leading-6">{report.note}</p>
                <p className="text-xs text-muted-foreground">Diamati {formatDateTime(report.observed_at)} · dikirim {formatDateTime(report.submitted_at)} oleh {userName(users, report.submitted_by)}</p>
                {report.evidence_url && <a className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline" href={report.evidence_url} target="_blank" rel="noreferrer noopener">Buka bukti<ExternalLink className="size-3" aria-hidden="true" /></a>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-title" className="space-y-3">
        <h3 id="history-title" className="flex items-center gap-2 text-sm font-semibold"><History className="size-4 text-teal" aria-hidden="true" />Riwayat status</h3>
        <ol className="relative space-y-4 border-l pl-5">
          {orderedHistory(task.history).reverse().map((change, index) => (
            <li key={`${change.at}-${index}`} className="relative">
              <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-card bg-primary" aria-hidden="true" />
              <p className="text-sm font-medium">{change.from ? `${taskStatusLabels[change.from]} → ${taskStatusLabels[change.to]}` : `Dibuat: ${taskStatusLabels[change.to]}`}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(change.at)} · {userName(users, change.actor_id, roleLabels[change.actor_role])} ({roleLabels[change.actor_role].toLowerCase()})</p>
              {change.note && <p className="mt-1 text-sm leading-6 text-muted-foreground">“{change.note}”</p>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function TaskDetail({ taskId, onBack }: { taskId: string; onBack: () => void }) {
  const task = useTask(taskId);
  return (
    <section aria-labelledby="task-detail-title" className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-1.5 rounded-md text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden">
        <ArrowLeft className="size-4" aria-hidden="true" />Kembali ke daftar
      </button>
      {task.status === "error" ? (
        <ErrorState title="Detail tugas belum dapat dimuat" description={errorMessage(task.error)} onRetry={task.refetch} />
      ) : !task.data ? (
        <div role="status" className="space-y-3"><span className="sr-only">Memuat detail tugas…</span><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40" /><Skeleton className="h-32" /></div>
      ) : (
        <DetailBody task={task.data} />
      )}
    </section>
  );
}
