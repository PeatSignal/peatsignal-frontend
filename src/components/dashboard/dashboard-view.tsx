"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity as ActivityIcon, ArrowRight, ClipboardCheck, Database, ListOrdered, Satellite, Waves } from "lucide-react";
import { navigation } from "@/components/layout/navigation";
import { useActor } from "@/components/providers/actor-context";
import { useDashboardSummary, useHotspotMap, usePriorities, useTasks } from "@/components/providers/data-hooks";
import { useIsDemoData } from "@/components/providers/gambutops-repository";
import { useMonitoring } from "@/components/providers/monitoring-context";
import { ErrorState } from "@/components/shared/async-states";
import { DemoBadge } from "@/components/shared/demo-badge";
import { HotspotMap } from "@/components/hotspots/hotspot-map";
import { PriorityBadge, TaskStatusBadge } from "@/components/tasks/task-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { errorMessage } from "@/lib/api";
import { findArea } from "@/lib/domain/areas";
import { decisionLabels, priorityLabels, taskStatusLabels } from "@/lib/domain/labels";
import { formatCount, formatDate, formatDateRange, formatDateTime } from "@/lib/format";
import type { Activity, DashboardSummary, InspectionTask, PriorityAssessment, PriorityLevel, User } from "@/types";

const page = navigation.find((item) => item.href === "/dashboard")!;
export const SETTINGS_ANCHOR = "pengaturan-data";
const PRIORITY_ORDER: Record<PriorityLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INSUFFICIENT_DATA: 3 };

export function DashboardHeader() {
  const { mode, filter } = useMonitoring();
  const demo = useIsDemoData();
  const area = findArea(filter.area_id);
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{page.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {area?.label ?? "Semua wilayah"} · {formatDateRange(filter.from, filter.to)}.{" "}
          <a href={`#${SETTINGS_ANCHOR}`} className="font-medium text-primary underline-offset-4 hover:underline">Ubah periode/wilayah</a>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={mode === "HISTORICAL_REPLAY" ? "teal" : "warning"}>{mode === "HISTORICAL_REPLAY" ? "RIWAYAT" : "TERKINI"}</Badge>
        {demo && <DemoBadge />}
      </div>
    </div>
  );
}

/** Tugas yang menunggu tindakan pengguna demo saat ini (sama dengan saringan di halaman Tugas). */
function myTasks(tasks: readonly InspectionTask[], actor: User): InspectionTask[] {
  if (actor.role === "coordinator") return tasks.filter((task) => ["OPEN", "SUBMITTED", "NEEDS_FOLLOWUP"].includes(task.status));
  return tasks.filter((task) => task.assignee_id === actor.id && ["ASSIGNED", "IN_PROGRESS"].includes(task.status));
}

function TopPriorityCard({ priorities }: { priorities: readonly PriorityAssessment[] | undefined }) {
  const top = priorities ? [...priorities].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])[0] : undefined;
  return (
    <section aria-labelledby="top-priority-title" className="flex flex-col rounded-xl border bg-card p-5">
      <h2 id="top-priority-title" className="flex items-center gap-2 text-sm font-semibold"><ListOrdered className="size-4 text-teal" aria-hidden="true" />Perlu diperiksa lebih dulu</h2>
      {!priorities ? <Skeleton className="mt-3 h-24" /> : !top ? (
        <p className="mt-3 text-sm text-muted-foreground">Belum ada penilaian untuk periode ini.</p>
      ) : (
        <div className="mt-3 flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold tracking-tight">{top.target.label}</p>
            <PriorityBadge priority={top.priority} />
          </div>
          <p className="text-sm leading-6 text-muted-foreground"><span className="font-medium text-foreground">{decisionLabels[top.decision]}.</span> {top.explanation}</p>

        </div>
      )}
      <Button asChild variant="outline" size="sm" className="mt-4 self-start"><Link href="/priorities">Lihat semua prioritas<ArrowRight aria-hidden="true" /></Link></Button>
    </section>
  );
}

function MyTasksCard({ tasks }: { tasks: readonly InspectionTask[] | undefined }) {
  const { actor } = useActor();
  const mine = tasks && actor ? myTasks(tasks, actor) : undefined;
  return (
    <section aria-labelledby="my-tasks-title" className="flex flex-col rounded-xl border bg-card p-5">
      <h2 id="my-tasks-title" className="flex items-center gap-2 text-sm font-semibold"><ClipboardCheck className="size-4 text-teal" aria-hidden="true" />Tugas yang menunggu Anda</h2>
      {!mine || !actor ? <Skeleton className="mt-3 h-24" /> : (
        <div className="mt-3 flex-1">
          {mine.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{actor.role === "coordinator" ? "Tidak ada tugas baru atau laporan yang perlu ditinjau." : "Tidak ada tugas yang perlu Anda kerjakan."}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {mine.slice(0, 3).map((task) => (
                <li key={task.id}>
                  <Link href={`/tasks?tugas=${encodeURIComponent(task.id)}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors duration-150 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="min-w-0 font-medium">{task.title}</span>
                    <TaskStatusBadge status={task.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {mine.length > 3 && <p className="mt-2 text-xs text-muted-foreground">+{mine.length - 3} tugas lainnya</p>}
        </div>
      )}
      <Button asChild variant="outline" size="sm" className="mt-4 self-start"><Link href="/tasks">Buka tugas lapangan<ArrowRight aria-hidden="true" /></Link></Button>
    </section>
  );
}

function StatTile({ href, icon: Icon, label, value, detail, tone }: {
  href: string; icon: typeof Satellite; label: string; value: string; detail: string; tone?: "warning";
}) {
  return (
    <Link href={href} className="group flex flex-col rounded-xl border bg-card p-4 transition-colors duration-150 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="size-4 text-teal" aria-hidden="true" />{label}</span>
      <span className={cn("mt-2 text-2xl font-bold tracking-tight tabular-nums", tone === "warning" && "text-amber-800")}>{value}</span>
      <span className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</span>
    </Link>
  );
}

function StatTiles({ summary }: { summary: DashboardSummary }) {
  const { hotspots, priorities, tasks, groundwater } = summary;
  const urgent = priorities.HIGH + priorities.MEDIUM;
  const gwtDays = groundwater.valid_days + groundwater.missing_days + groundwater.duplicate_days;
  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4" aria-label="Angka ringkasan">
      <StatTile
        href="/hotspots" icon={Satellite} label="Titik panas" value={formatCount(hotspots.total)}
        detail={hotspots.total === 0 ? "Tidak ada deteksi pada periode ini (bukan berarti aman)." : `${formatCount(hotspots.unverified)} belum diverifikasi${hotspots.unverified_scope === "PAGE" ? " pada titik terbaru yang dimuat" : ""}.`}
      />
      <StatTile
        href="/priorities" icon={ListOrdered} label="Wilayah prioritas tinggi/sedang" value={formatCount(urgent)} tone={priorities.HIGH > 0 ? "warning" : undefined}
        detail={`${priorityLabels.HIGH}: ${priorities.HIGH} · ${priorityLabels.MEDIUM}: ${priorities.MEDIUM} · ${priorityLabels.INSUFFICIENT_DATA}: ${priorities.INSUFFICIENT_DATA}`}
      />
      <StatTile
        href="/tasks" icon={ClipboardCheck} label="Tugas aktif" value={formatCount(tasks.active)}
        detail={`${tasks.awaiting_review} menunggu tinjauan · ${tasks.closed} selesai`}
      />
      <StatTile
        href="/groundwater" icon={Waves} label="Data muka air tanah"
        value={groundwater.availability === "AVAILABLE" && gwtDays > 0 ? `${Math.round((groundwater.valid_days / gwtDays) * 100)}%` : "–"}
        detail={groundwater.availability === "AVAILABLE" ? `${formatCount(groundwater.valid_days)} hari terukur dari ${groundwater.stations} stasiun` : groundwater.notice ?? "Tidak tersedia."}
      />
    </div>
  );
}

function activityText(activity: Activity): string {
  if (activity.kind === "TASK_CREATED") return "membuat tugas";
  if (activity.kind === "REPORT_SUBMITTED") return "mengirim laporan";
  return activity.status ? `mengubah status menjadi ${taskStatusLabels[activity.status].toLowerCase()}` : "memperbarui tugas";
}

function ActivityFeed({ activity }: { activity: readonly Activity[] }) {
  const { users } = useActor();
  return (
    <section aria-labelledby="activity-title" className="rounded-xl border bg-card p-5">
      <h2 id="activity-title" className="flex items-center gap-2 text-sm font-semibold"><ActivityIcon className="size-4 text-teal" aria-hidden="true" />Kegiatan terbaru</h2>
      {activity.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Belum ada kegiatan tugas pada jenis data ini.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {activity.map((item) => (
            <li key={item.id} className="text-sm leading-6">
              <span className="font-medium">{users.find((user) => user.id === item.actor_id)?.display_name ?? "Pengguna"}</span> {activityText(item)}{" "}
              <Link href={`/tasks?tugas=${encodeURIComponent(item.task_id)}`} className="font-medium text-primary underline-offset-4 hover:underline">{item.task_title}</Link>
              <span className="block text-xs text-muted-foreground">{formatDateTime(item.at)}{item.is_simulation ? " · SIMULASI" : ""}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Provenance({ summary }: { summary: DashboardSummary }) {
  return (
    <p className="flex flex-wrap items-start gap-x-2 gap-y-1 text-xs leading-5 text-muted-foreground">
      <Database className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>Data sampai {formatDate(summary.as_of)}.</span>
      {summary.hotspots.source && <span>Titik panas: {summary.hotspots.source}{summary.hotspots.last_synced_at ? `, diperbarui ${formatDateTime(summary.hotspots.last_synced_at)}` : ""}.</span>}
    </p>
  );
}

export function DashboardView() {
  const router = useRouter();
  const { mode, filter } = useMonitoring();
  const summary = useDashboardSummary();
  const priorities = usePriorities();
  const tasks = useTasks();
  // Gunakan seluruh marker dan cache yang sama dengan peta halaman Titik panas.
  const hotspots = useHotspotMap();

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <TopPriorityCard priorities={priorities.data} />
        <MyTasksCard tasks={tasks.data} />
      </div>

      {summary.status === "error" ? (
        <ErrorState title="Ringkasan belum dapat dimuat" description={errorMessage(summary.error)} onRetry={summary.refetch} />
      ) : !summary.data ? (
        <div role="status" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4"><span className="sr-only">Memuat ringkasan…</span>{[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-28 rounded-xl" />)}</div>
      ) : (
        <StatTiles summary={summary.data} />
      )}

      <section aria-labelledby="map-title" className="space-y-3 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="map-title" className="flex items-center gap-2 text-sm font-semibold"><Satellite className="size-4 text-teal" aria-hidden="true" />Peta titik panas terbaru</h2>
          <Button asChild variant="outline" size="sm"><Link href="/hotspots">Buka peta lengkap<ArrowRight aria-hidden="true" /></Link></Button>
        </div>
        {hotspots.status === "error" ? (
          <ErrorState title="Peta titik panas belum dapat dimuat" description={errorMessage(hotspots.error)} onRetry={hotspots.refetch} />
        ) : (
          <HotspotMap hotspots={hotspots.data?.items ?? []} selectedId={null} onSelect={() => router.push("/hotspots")} areaId={filter.area_id} national={mode === "CURRENT_MONITORING"} className="h-[280px] sm:h-[360px]" />
        )}
        <p className="text-xs text-muted-foreground">
          {hotspots.data ? `Menampilkan ${formatCount(hotspots.data.items.length)} titik sesuai filter · ${mode === "CURRENT_MONITORING" ? "Seluruh Indonesia" : "cakupan sama dengan halaman Titik panas"}.` : hotspots.status === "loading" ? "Memuat titik panas…" : ""}
        </p>
      </section>

      {summary.data && <ActivityFeed activity={summary.data.activity} />}
      {summary.data && <Provenance summary={summary.data} />}
    </div>
  );
}
