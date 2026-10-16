"use client";

import { useMonitoring } from "@/components/providers/monitoring-context";
import { cn } from "@/components/ui/utils";
import { addDays, clampDate, daysBetween } from "@/lib/domain/dates";
import { formatDateRange } from "@/lib/format";
import type { Station } from "@/types";

interface Preset {
  key: string;
  label: string;
  from: string;
  to: string;
}

/** Pintasan periode. 30/90 hari mempertahankan akhir periode; "seluruh data" mengikuti periode stasiun. */
export function RangePresets({ station }: { station: Station }) {
  const { bounds, filter, setFilter } = useMonitoring();
  const clamp = (date: string) => clampDate(date, bounds.min_date, bounds.max_date);
  const presets: Preset[] = [30, 90].map((days) => ({ key: `${days}`, label: `${days} hari`, from: clamp(addDays(filter.to, -(days - 1))), to: filter.to }));
  if (station.period_start && station.period_end) {
    presets.push({ key: "station", label: "Seluruh data stasiun", from: clamp(station.period_start), to: clamp(station.period_end) });
  }

  return (
    <div role="group" aria-label="Pintasan periode" className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const active = preset.from === filter.from && preset.to === filter.to;
        return (
          <button
            key={preset.key} type="button" aria-pressed={active}
            title={`${formatDateRange(preset.from, preset.to)} (${daysBetween(preset.from, preset.to) + 1} hari)`}
            onClick={() => setFilter({ from: preset.from, to: preset.to })}
            className={cn(
              "h-9 rounded-md border px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-primary/20 bg-secondary text-primary" : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
