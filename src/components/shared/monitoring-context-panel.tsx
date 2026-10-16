"use client";

import { useId } from "react";
import { usePathname } from "next/navigation";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { useMonitoring } from "@/components/providers/monitoring-context";
import { useRepository } from "@/components/providers/gambutops-repository";
import { useAreas } from "@/components/providers/data-hooks";
import { formatDate } from "@/lib/format";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-picker";

export function MonitoringContextPanel({ id: sectionId }: { id?: string } = {}) {
  const { mode, bounds, filter, asOf, setFilter, resetFilter } = useMonitoring();
  const repository = useRepository();
  const areas = useAreas();
  const id = useId();
  const historical = mode === "HISTORICAL_REPLAY";
  const demo = repository.kind === "mock";
  const nationalHotspots = usePathname() === "/hotspots" && !historical;
  const isDefault = filter.from === bounds.default_from && filter.to === bounds.default_to && filter.area_id === null;

  return <section id={sectionId} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-xl border bg-card p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4 text-teal" aria-hidden="true" />Filter data</h2>
      {!isDefault && <Button variant="ghost" size="sm" onClick={resetFilter}><RotateCcw aria-hidden="true" />Reset</Button>}
    </div>
    <div className="space-y-4">
      <div className="space-y-1.5"><p className="text-xs text-muted-foreground">Periode</p>
        <DateRangePicker key={mode} value={filter} min={bounds.min_date} max={bounds.max_date} onChange={(range) => setFilter(range)} />
      </div>
      {nationalHotspots ? <p className="text-sm">Wilayah: Seluruh Indonesia</p> : <label className="block space-y-1.5 text-xs text-muted-foreground" htmlFor={`${id}-area`}>
        <span>Wilayah</span>
        <Select id={`${id}-area`} aria-label="Wilayah" value={filter.area_id ?? ""} onValueChange={(value) => setFilter({ area_id: value || null })}
          options={[{ value: "", label: "Semua wilayah" }, ...(areas.data?.map((area) => ({ value: area.id, label: area.label })) ?? [])]} />
      </label>}
      {!historical && <p role="note" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Data muka air terkini tidak tersedia</p>}
      <details className="border-t pt-3 text-xs leading-5 text-muted-foreground">
        <summary className="cursor-pointer font-medium hover:text-foreground">Detail data</summary>
        <div className="mt-2 space-y-2">
          <p>{demo ? "Data contoh (DEMO). Tugas dan laporan tersimpan di browser." : "Data dari server PeatSignal. Laporan demo berlabel SIMULASI."}</p>
          <p>Rentang tersedia: {formatDate(bounds.min_date)} – {formatDate(bounds.max_date)}.</p>
          <p>{historical ? `Data setelah ${formatDate(asOf)} tidak dipakai.` : "Data GWT 2018–2019 tidak mewakili kondisi terkini."}</p>
        </div>
      </details>
    </div>
  </section>;
}
