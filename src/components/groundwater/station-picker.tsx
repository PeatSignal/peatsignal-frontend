"use client";

import { useId } from "react";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import type { Station } from "@/types";

export function StationPicker({ stations, value, onChange }: { stations: readonly Station[]; value: string | null; onChange: (code: string) => void }) {
  const id = useId();
  return <div className="space-y-1.5">
    <label htmlFor={id} className="text-xs font-medium text-muted-foreground">Stasiun pengukuran</label>
    <Select id={id} aria-label="Stasiun pengukuran" value={value ?? ""} onValueChange={onChange}
      options={stations.map((station) => ({ value: station.code, label: station.code,
        description: station.period_end ? `Data s.d. ${formatDate(station.period_end)}` : "Periode belum tercatat",
        group: station.region ?? "Wilayah belum tercatat" }))} />
  </div>;
}
