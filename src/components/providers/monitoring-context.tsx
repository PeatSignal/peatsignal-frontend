"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { clampDate } from "@/lib/domain/dates";
import type { ModeBounds } from "@/lib/domain/periods";
import type { MonitoringMode } from "@/types";
import { useRepository } from "./gambutops-repository";

export type { MonitoringMode };

export interface PeriodFilter {
  from: string;
  to: string;
  area_id: string | null;
}

interface MonitoringContextValue {
  mode: MonitoringMode;
  setMode: (mode: MonitoringMode) => void;
  bounds: ModeBounds;
  /** Filter milik mode aktif. Setiap mode menyimpan filternya sendiri. */
  filter: PeriodFilter;
  /** Batas informasi; selalu sama dengan akhir periode. */
  asOf: string;
  setFilter: (patch: Partial<PeriodFilter>) => void;
  resetFilter: () => void;
}

const MonitoringContext = createContext<MonitoringContextValue | null>(null);

function defaultFilter(bounds: ModeBounds): PeriodFilter {
  return { from: bounds.default_from, to: bounds.default_to, area_id: null };
}

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const repository = useRepository();
  const [mode, setMode] = useState<MonitoringMode>("HISTORICAL_REPLAY");
  const [filters, setFilters] = useState<Record<MonitoringMode, PeriodFilter>>(() => ({
    HISTORICAL_REPLAY: defaultFilter(repository.getModeBounds("HISTORICAL_REPLAY")),
    CURRENT_MONITORING: defaultFilter(repository.getModeBounds("CURRENT_MONITORING")),
  }));
  const bounds = useMemo(() => repository.getModeBounds(mode), [repository, mode]);
  const filter = filters[mode];

  const setFilter = useCallback((patch: Partial<PeriodFilter>) => {
    setFilters((previous) => {
      const current = { ...previous[mode], ...patch };
      let from = clampDate(current.from, bounds.min_date, bounds.max_date);
      let to = clampDate(current.to, bounds.min_date, bounds.max_date);
      // Jaga urutan tanggal: ubah sisi lain mengikuti tanggal yang baru dipilih.
      if (from > to) {
        if (patch.from !== undefined) to = from;
        else from = to;
      }
      return { ...previous, [mode]: { from, to, area_id: current.area_id } };
    });
  }, [bounds, mode]);

  const resetFilter = useCallback(() => {
    setFilters((previous) => ({ ...previous, [mode]: defaultFilter(bounds) }));
  }, [bounds, mode]);

  const value = useMemo(() => ({ mode, setMode, bounds, filter, asOf: filter.to, setFilter, resetFilter }), [mode, bounds, filter, setFilter, resetFilter]);
  return <MonitoringContext.Provider value={value}>{children}</MonitoringContext.Provider>;
}

export function useMonitoring() {
  const value = useContext(MonitoringContext);
  if (!value) throw new Error("useMonitoring membutuhkan MonitoringProvider.");
  return value;
}
