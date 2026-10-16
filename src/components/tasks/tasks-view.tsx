"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ClipboardList } from "lucide-react";
import { navigation } from "@/components/layout/navigation";
import { useActor } from "@/components/providers/actor-context";
import { useTasks } from "@/components/providers/data-hooks";
import { useIsDemoData } from "@/components/providers/gambutops-repository";
import { useMonitoring } from "@/components/providers/monitoring-context";
import { EmptyState, ErrorState } from "@/components/shared/async-states";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { errorMessage } from "@/lib/api";
import { findArea } from "@/lib/domain/areas";
import { isTerminal } from "@/lib/domain/task-state-machine";
import { formatDateTime } from "@/lib/format";
import type { InspectionTask, User } from "@/types";
import { PriorityBadge, TaskStatusBadge } from "./task-badges";
import { TaskDetail } from "./task-detail";

const page = navigation.find((item) => item.href === "/tasks")!;
const TASK_PARAM = "tugas";

type FilterId = "mine" | "active" | "review" | "done" | "all";

/** Tugas yang menunggu tindakan dari pengguna demo saat ini. */
function needsMyAction(task: InspectionTask, actor: User): boolean {
  if (actor.role === "coordinator") return ["OPEN", "SUBMITTED", "NEEDS_FOLLOWUP"].includes(task.status);
  return task.assignee_id === actor.id && ["ASSIGNED", "IN_PROGRESS"].includes(task.status);
}

const FILTERS: ReadonlyArray<{ id: FilterId; label: string; match: (task: InspectionTask, actor: User) => boolean }> = [
  { id: "mine", label: "Perlu tindakan saya", match: needsMyAction },
  { id: "active", label: "Aktif", match: (task) => !isTerminal(task.status) },
  { id: "review", label: "Menunggu tinjauan", match: (task) => task.status === "SUBMITTED" },
  { id: "done", label: "Selesai", match: (task) => isTerminal(task.status) },
  { id: "all", label: "Semua", match: () => true },
];

export function TasksHeader() {
  const { mode } = useMonitoring();
  const demo = useIsDemoData();
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{page.title}</h1>
        <Button asChild variant="link" className="mt-1 h-auto px-0"><Link href="/priorities">Buat tugas dari prioritas</Link></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={mode === "HISTORICAL_REPLAY" ? "teal" : "warning"}>{mode === "HISTORICAL_REPLAY" ? "RIWAYAT" : "TERKINI"}</Badge>
        <DemoBadge report />
        {demo && <DemoBadge />}
      </div>
    </div>
  );
}

function TaskListItem({ task, users, selected, onSelect }: { task: InspectionTask; users: readonly User[]; selected: boolean; onSelect: () => void }) {
  const assignee = users.find((user) => user.id === task.assignee_id)?.display_name ?? "Belum ditugaskan";
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn("flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors duration-150 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected && "border-primary bg-secondary/40")}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold">{task.title}</p>
          <div className="flex flex-wrap gap-1.5"><TaskStatusBadge status={task.status} /><PriorityBadge priority={task.priority} /></div>
          <p className="text-xs leading-5 text-muted-foreground">{findArea(task.area_id)?.label ?? "Wilayah belum tercatat"} · {assignee} · diperbarui {formatDateTime(task.updated_at)}</p>
        </div>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </li>
  );
}

export function TasksView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get(TASK_PARAM);
  const { actor, users } = useActor();
  const tasks = useTasks();
  const [filter, setFilter] = useState<FilterId>("mine");

  const select = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set(TASK_PARAM, id);
    else params.delete(TASK_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const counts = useMemo(() => {
    const result = {} as Record<FilterId, number>;
    for (const item of FILTERS) result[item.id] = actor ? (tasks.data ?? []).filter((task) => item.match(task, actor)).length : 0;
    return result;
  }, [actor, tasks.data]);

  if (tasks.status === "error") return <ErrorState title="Tugas belum dapat dimuat" description={errorMessage(tasks.error)} onRetry={tasks.refetch} />;
  if (!tasks.data || !actor) {
    return <div role="status" className="space-y-3"><span className="sr-only">Memuat tugas…</span>{[0, 1, 2].map((index) => <Skeleton key={index} className="h-28 rounded-xl" />)}</div>;
  }

  const active = FILTERS.find((item) => item.id === filter) ?? FILTERS[0]!;
  const visible = tasks.data.filter((task) => active.match(task, actor));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:items-start">
      <div className={cn("space-y-4", selectedId && "hidden xl:block")}>
        <div role="group" aria-label="Saring tugas" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <Button key={item.id} size="sm" variant={item.id === filter ? "default" : "outline"} aria-pressed={item.id === filter} onClick={() => setFilter(item.id)}>
              {item.label}<span className={cn("rounded px-1.5 text-[11px] tabular-nums", item.id === filter ? "bg-white/20" : "bg-muted")}>{counts[item.id]}</span>
            </Button>
          ))}
        </div>
        {visible.length === 0 ? (
          <EmptyState
            title={filter === "mine" ? "Tidak ada yang perlu Anda kerjakan" : "Tidak ada tugas"}
            description={tasks.data.length === 0 ? <>Belum ada tugas pada jenis data ini. Buat tugas dari <Link href="/priorities" className="font-medium text-primary underline-offset-4 hover:underline">Prioritas pemeriksaan</Link>.</> : "Coba pilih saringan lain."}
          />
        ) : (
          <ul className="space-y-3" aria-label="Daftar tugas">
            {visible.map((task) => <TaskListItem key={task.id} task={task} users={users} selected={task.id === selectedId} onSelect={() => select(task.id)} />)}
          </ul>
        )}
      </div>
      <div className={cn(!selectedId && "hidden xl:block")}>
        {selectedId ? (
          <TaskDetail key={selectedId} taskId={selectedId} onBack={() => select(null)} />
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
            <ClipboardList className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Pilih tugas untuk melihat detail</p>
          </div>
        )}
      </div>
    </div>
  );
}
