"use client";

import { useCallback } from "react";
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
    <div role="group" aria-label="Jenis data" className="flex w-full rounded-lg bg-muted/60 p-1 sm:inline-flex sm:w-auto">
      {([
        ["HISTORICAL_REPLAY", "Riwayat"],
        ["CURRENT_MONITORING", "Terkini"],
      ] as const).map(([value, label]) => (
        <button
          key={value} type="button" aria-pressed={mode === value}
          title={modeDescriptions[value]} onClick={() => changeMode(value)}
          className={cn("flex min-h-8 flex-1 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none", mode === value ? "bg-card text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
