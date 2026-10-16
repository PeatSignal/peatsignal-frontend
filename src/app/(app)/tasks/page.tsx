import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TasksHeader, TasksView } from "@/components/tasks/tasks-view";

export const metadata: Metadata = { title: "Tugas lapangan" };

export default function TasksPage() {
  return (
    <div className="space-y-7">
      <TasksHeader />
      {/* Tugas terpilih dibaca dari URL (?tugas=…), sehingga butuh Suspense saat prerender. */}
      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}><TasksView /></Suspense>
    </div>
  );
}
