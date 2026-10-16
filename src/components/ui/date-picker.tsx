"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { calendarDate, calendarValue } from "@/lib/calendar-date";
import { formatDate, formatDateRange } from "@/lib/format";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./utils";

type DatePickerProps = {
  id?: string; label: string; value: string; onChange: (value: string) => void;
  min?: string; max?: string; invalid?: boolean; describedBy?: string; className?: string;
};

export function DatePicker({ id, label, value, onChange, min, max, invalid, describedBy, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button id={id} type="button" variant="outline" aria-label={label} aria-invalid={invalid} aria-describedby={describedBy}
      data-date={value} className={cn("w-full min-w-0 justify-start font-normal aria-[invalid=true]:border-destructive", className)}>
      <CalendarDays aria-hidden="true" /><span className="truncate">{value ? formatDate(value) : "Pilih tanggal"}</span>
    </Button></PopoverTrigger>
    <PopoverContent aria-label={label}>
      <Calendar key={value} mode="single" required autoFocus selected={value ? calendarDate(value) : undefined} defaultMonth={value ? calendarDate(value) : undefined}
        startMonth={calendarDate(min ?? "1900-01-01")} endMonth={calendarDate(max ?? "2100-12-31")}
        disabled={[...(min ? [{ before: calendarDate(min) }] : []), ...(max ? [{ after: calendarDate(max) }] : [])]}
        onSelect={(date) => { if (date) { onChange(calendarValue(date)); setOpen(false); } }} />
    </PopoverContent>
  </Popover>;
}

export type DateRangeValue = { from: string; to: string };

export function DateRangePicker({ value, onChange, min, max }: {
  value: DateRangeValue; onChange: (value: DateRangeValue) => void; min: string; max: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  function changeOpen(next: boolean) {
    if (next) setDraft({ from: calendarDate(value.from), to: calendarDate(value.to) });
    setOpen(next);
  }
  return <Popover open={open} onOpenChange={changeOpen}>
    <PopoverTrigger asChild><Button type="button" variant="outline" aria-label="Periode" data-from={value.from} data-to={value.to}
      className="w-full min-w-0 justify-start px-3 font-normal">
      <CalendarDays aria-hidden="true" /><span className="truncate">{formatDateRange(value.from, value.to)}</span>
    </Button></PopoverTrigger>
    <PopoverContent aria-label="Pilih periode">
      <Calendar mode="range" autoFocus selected={draft} required resetOnSelect onSelect={setDraft} defaultMonth={calendarDate(value.from)}
        startMonth={calendarDate(min)} endMonth={calendarDate(max)} disabled={[{ before: calendarDate(min) }, { after: calendarDate(max) }]} />
      <p aria-live="polite" className="mt-3 max-w-[266px] text-xs text-muted-foreground">{draft?.from ? draft.to ? formatDateRange(calendarValue(draft.from), calendarValue(draft.to)) : `${formatDate(calendarValue(draft.from))} · Pilih tanggal akhir` : "Pilih tanggal mulai"}</p>
      <div className="mt-3 flex justify-end gap-2 border-t pt-3">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
        <Button type="button" size="sm" disabled={!draft?.from || !draft.to} onClick={() => {
          if (draft?.from && draft.to) { onChange({ from: calendarValue(draft.from), to: calendarValue(draft.to) }); setOpen(false); }
        }}>Terapkan</Button>
      </div>
    </PopoverContent>
  </Popover>;
}
