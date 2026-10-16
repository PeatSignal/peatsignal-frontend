"use client";

import { DatePicker } from "./date-picker";
import { cn } from "./utils";

/** Keeps the existing local datetime string; serialization to UTC belongs to the form. */
export function DateTimePicker({ value, onChange, invalid, errorId }: {
  value: string; onChange: (value: string) => void; invalid?: boolean; errorId?: string;
}) {
  const [date = "", time = "00:00:00"] = value.split("T");
  const parts = time.split(":");
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <div className="space-y-2">
    <DatePicker label="Tanggal pengamatan" value={date} invalid={invalid} describedBy={errorId}
      onChange={(next) => onChange(`${next}T${time}`)} />
    <div className="flex items-center gap-2">
      {["Jam", "Menit", "Detik"].map((label, index) => <label key={label} className="min-w-0 flex-1 space-y-1 text-xs font-normal text-muted-foreground">
        <span>{label}</span>
        <input type="number" inputMode="numeric" aria-label={label} aria-invalid={invalid} aria-describedby={errorId} min={0} max={index === 0 ? 23 : 59} step={1}
          className={cn("h-10 w-full rounded-md border bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring", invalid && "border-destructive")}
          value={parts[index] ?? "00"} onChange={(event) => {
            const next = [...parts];
            next[index] = event.target.value === "" ? "" : event.target.value.padStart(2, "0");
            onChange(`${date}T${next.join(":")}`);
          }} />
      </label>)}
    </div>
    <p className="text-xs font-normal text-muted-foreground">Waktu lokal · {zone}</p>
  </div>;
}
