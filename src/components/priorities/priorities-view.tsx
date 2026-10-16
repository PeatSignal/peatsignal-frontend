"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardPlus, Info, ListChecks, ShieldAlert } from "lucide-react";
import { navigation } from "@/components/layout/navigation";
import { useActor } from "@/components/providers/actor-context";
import { usePriorities, useTasks } from "@/components/providers/data-hooks";
import { useIsDemoData } from "@/components/providers/gambutops-repository";
import { useMonitoring } from "@/components/providers/monitoring-context";
import { EmptyState, ErrorState } from "@/components/shared/async-states";
import { DemoBadge } from "@/components/shared/demo-badge";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { PriorityBadge, TaskStatusBadge } from "@/components/tasks/task-badges";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";
import { decisionLabels, missingInputLabels, priorityLabels, reasonCodeLabels } from "@/lib/domain/labels";
import { isTerminal } from "@/lib/domain/task-state-machine";
import { formatCount, formatDate, formatDateTime, formatDecimal } from "@/lib/format";
import type { AssessmentInput, InspectionTask, PriorityAssessment, PriorityLevel } from "@/types";

const page = navigation.find((item) => item.href === "/priorities")!;
const LEVELS: readonly PriorityLevel[] = ["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"];

export function PrioritiesHeader() {
  const { mode } = useMonitoring();
  const demo = useIsDemoData();
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{page.title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={mode === "HISTORICAL_REPLAY" ? "teal" : "warning"}>{mode === "HISTORICAL_REPLAY" ? "RIWAYAT" : "TERKINI"}</Badge>
        {demo && <DemoBadge />}
      </div>
    </div>
  );
}

function formatInputValue(input: AssessmentInput): string {
  if (input.value === null) return "Tidak tersedia";
  if (typeof input.value === "boolean") return input.value ? "Ya" : "Tidak";
  if (typeof input.value === "string") return input.value;
  if (input.unit === "m") return `${input.value > 0 ? "+" : ""}${formatDecimal(input.value, 3)} m`;
  return `${formatCount(input.value)}${input.unit ? ` ${input.unit}` : ""}`;
}

function relatedTasks(assessment: PriorityAssessment, tasks: readonly InspectionTask[]): InspectionTask[] {
  return tasks.filter((task) => task.assessment_id === assessment.id || (task.area_id !== null && task.area_id === assessment.area_id && !isTerminal(task.status)));
}

function AssessmentCard({ assessment, tasks }: { assessment: PriorityAssessment; tasks: readonly InspectionTask[] }) {
  const { actor } = useActor();
  const [creating, setCreating] = useState(false);
  const linked = relatedTasks(assessment, tasks);
  const activeLinked = linked.filter((task) => !isTerminal(task.status));
  const coordinator = actor?.role === "coordinator";
  const headingId = `assessment-${assessment.id}`;

  return (
    <article aria-labelledby={headingId} className="overflow-hidden rounded-xl border bg-card">
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={headingId} className="text-base font-semibold">{assessment.target.label}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Keputusan: <span className="font-medium text-foreground">{decisionLabels[assessment.decision]}</span> · data sampai {formatDate(assessment.as_of)}</p>
          </div>
          <PriorityBadge priority={assessment.priority} />
        </div>
        <p className="text-sm leading-6">{assessment.explanation}</p>

        <div className="grid gap-4 lg:grid-cols-2">
          <section aria-label="Alasan">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Alasan</h3>
            {assessment.reason_codes.length ? (
              <ul className="mt-2 space-y-1.5 text-sm leading-6">
                {assessment.reason_codes.slice(0, 1).map((code) => <li key={code} className="flex gap-2"><ListChecks className="mt-1 size-4 shrink-0 text-teal" aria-hidden="true" />{reasonCodeLabels[code] ?? code}</li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-muted-foreground">Tidak ada alasan tercatat.</p>}
          </section>
          <section aria-label="Data yang belum tersedia">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Data belum tersedia</h3>
            {assessment.missing_inputs.length ? (
              <ul className="mt-2 space-y-1.5 text-sm leading-6">
                {assessment.missing_inputs.map((code) => <li key={code} className="flex gap-2"><ShieldAlert className="mt-1 size-4 shrink-0 text-amber-700" aria-hidden="true" />{missingInputLabels[code] ?? code}</li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-muted-foreground">Semua data yang dibutuhkan tersedia.</p>}
          </section>
        </div>

        <details className="rounded-lg border p-3 text-sm">
          <summary className="cursor-pointer font-medium">Detail penilaian</summary>
          <p className="mt-3 text-xs text-muted-foreground">Aturan {assessment.rule_version} · heuristik, belum divalidasi ilmiah</p>
          {assessment.reason_codes.length > 1 && (
            <div className="mt-3">
              <h3 className="text-xs font-semibold text-muted-foreground">Semua alasan</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">{assessment.reason_codes.map((code) => <li key={code}>{reasonCodeLabels[code] ?? code}</li>)}</ul>
            </div>
          )}
          <h3 className="mt-3 text-xs font-semibold text-muted-foreground">Data yang dipakai</h3>
          <dl className="mt-2 grid gap-2 min-[480px]:grid-cols-2 xl:grid-cols-3">
            {assessment.input_snapshot.map((input) => (
              <div key={input.key} className="rounded-lg bg-muted/60 px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">{input.label}</dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums">{formatInputValue(input)}</dd>
                <dd className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{input.source}{input.observed_at ? ` · ${input.observed_at.length > 10 ? formatDateTime(input.observed_at) : formatDate(input.observed_at)}` : ""}</dd>
              </div>
            ))}
          </dl>
          {assessment.raw_input_snapshot && (
            <details className="mt-3 border-t pt-3 text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">Lihat data mentah snapshot (untuk audit)</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-[11px] leading-4">{JSON.stringify(assessment.raw_input_snapshot, null, 2)}</pre>
            </details>
          )}
        </details>

        {assessment.recommended_actions.length > 0 && (
          <section aria-label="Rekomendasi" className="rounded-lg border border-primary/15 bg-secondary/40 p-3.5">
            <h3 className="text-xs font-semibold tracking-wide text-primary uppercase">Rekomendasi</h3>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6">{assessment.recommended_actions.map((action) => <li key={action}>{action}</li>)}</ul>
          </section>
        )}

        {linked.length > 0 && (
          <section aria-label="Tugas terkait">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tugas terkait</h3>
            <ul className="mt-2 space-y-2">
              {linked.map((task) => (
                <li key={task.id}>
                  <Link href={`/tasks?tugas=${encodeURIComponent(task.id)}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="min-w-0 font-medium">{task.title}</span>
                    <span className="flex items-center gap-2"><TaskStatusBadge status={task.status} /><ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3.5 sm:px-6">
        <p className="text-xs leading-5 text-muted-foreground">
          {activeLinked.length > 0 ? `${activeLinked.length} tugas aktif` : "Belum ada tugas aktif"}
        </p>
        {coordinator ? (
          <Button size="sm" onClick={() => setCreating(true)}><ClipboardPlus aria-hidden="true" />{activeLinked.length > 0 ? "Buat tugas lagi" : "Buat tugas"}</Button>
        ) : (
          <span className="text-xs text-muted-foreground">Hanya koordinator yang dapat membuat tugas.</span>
        )}
      </div>

      {creating && <CreateTaskDialog source={{ kind: "assessment", assessment }} open={creating} onOpenChange={setCreating} />}
    </article>
  );
}

export function PrioritiesView() {
  const priorities = usePriorities();
  const tasks = useTasks();
  const { mode } = useMonitoring();

  if (priorities.status === "error") {
    return <ErrorState title="Prioritas belum dapat dimuat" description={errorMessage(priorities.error)} onRetry={priorities.refetch} />;
  }
  if (!priorities.data) {
    return (
      <div role="status" aria-live="polite" className="space-y-4">
        <span className="sr-only">Memuat prioritas…</span>
        {[0, 1].map((index) => <Skeleton key={index} className="h-72 rounded-xl" />)}
      </div>
    );
  }
  const items = priorities.data;
  const counts = LEVELS.map((level) => [level, items.filter((item) => item.priority === level).length] as const);

  return (
    <div className="min-w-0 space-y-5">
      <Alert className="border-amber-200 bg-amber-50">
        <Info className="text-amber-800" aria-hidden="true" />
        <div>
          <AlertTitle>Prioritas pemeriksaan · bukan prediksi kebakaran</AlertTitle>
        </div>
      </Alert>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Jumlah per tingkat prioritas">
        {counts.map(([level, count]) => (
          <div key={level} className="rounded-xl border bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">{priorityLabels[level]}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{count}</dd>
          </div>
        ))}
      </dl>

      {items.length === 0 ? (
        <EmptyState title="Belum ada prioritas" description={mode === "CURRENT_MONITORING" ? "Belum ada data terkini untuk dinilai pada periode ini." : "Tidak ada wilayah yang dinilai untuk periode dan wilayah ini."} />
      ) : (
        items.map((item) => <AssessmentCard key={item.id} assessment={item} tasks={tasks.data ?? []} />)
      )}
    </div>
  );
}
