"use client";

import type { ReactNode } from "react";
import { AlertCircle, Inbox, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Memuat informasi…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4 rounded-xl border bg-card p-6">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Skeleton className="h-6 w-48 max-w-full" /><Skeleton className="h-32 w-full" />
    </div>
  );
}

export function EmptyState({ title = "Belum ada data", description = "Belum ada pengamatan untuk konteks yang dipilih.", action }: { title?: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center rounded-xl border bg-card px-6 py-12 text-center">
      <Inbox className="mb-4 size-8 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Informasi belum dapat dimuat", description = "Terjadi kendala saat memuat informasi. Silakan coba lagi.", onRetry }: {
  title?: string; description?: string; onRetry: () => void;
}) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-card p-6">
      <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" /><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div></div>
      <Button variant="outline" className="mt-5" onClick={onRetry}><RotateCcw aria-hidden="true" />Coba lagi</Button>
    </div>
  );
}
