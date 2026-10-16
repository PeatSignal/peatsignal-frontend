"use client";

import { useCallback } from "react";
import { History, Satellite } from "lucide-react";
import { toast } from "sonner";
import { useMonitoring, type MonitoringMode } from "@/components/providers/monitoring-context";
import { modeDescriptions, modeLabels } from "@/lib/domain/labels";
import { cn } from "@/components/ui/utils";

/** Pindah jenis data dengan umpan balik yang sama di semua tempat (header maupun tombol di halaman). */
export function useSwitchMode() {
  const { mode, setMode } = useMonitoring();
  return useCallback((next: MonitoringMode) => {
    if (next === mode) return;
    setMode(next);
    toast.info(`${modeLabels[next]} aktif`, { description: modeDescriptions[next] });
  }, [mode, setMode]);
}

export function ModeSwitcher() {
  const { mode } = useMonitoring();
  const changeMode = useSwitchMode();

  return (
    <div role="group" aria-label="Jenis data" className="flex w-full rounded-lg border bg-muted/60 p-1 sm:inline-flex sm:w-auto">
      {([
        ["HISTORICAL_REPLAY", "Riwayat", History],
        ["CURRENT_MONITORING", "Terkini", Satellite],
      ] as const).map(([value, label, Icon]) => (
        <button
          key={value} type="button" aria-pressed={mode === value}
          title={modeDescriptions[value]} onClick={() => changeMode(value)}
          className={cn("flex min-h-9 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none", mode === value ? "bg-card text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />{label}
        </button>
      ))}
    </div>
  );
}
