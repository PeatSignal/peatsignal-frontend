"use client";

import { DayPicker, getDefaultClassNames, type DropdownProps, type DayPickerProps } from "react-day-picker";
import { id } from "date-fns/locale";
import type { ChangeEvent } from "react";
import { Select } from "./select";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "./utils";

/** DayPicker's dropdown callback only reads target.value; keep its date navigation intact. */
function CalendarDropdown({ options, value, onChange, disabled, "aria-label": label }: DropdownProps) {
  return <Select aria-label={label} value={String(value ?? "")} disabled={disabled}
    onValueChange={(next) => onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)}
    options={options?.map((option) => ({ value: String(option.value), label: option.label, disabled: option.disabled })) ?? []}
    className="h-9 w-auto gap-1 border-transparent bg-transparent px-1.5 text-xs font-medium" />;
}

export function Calendar({ className, classNames, ...props }: DayPickerProps) {
  const defaults = getDefaultClassNames();
  return <DayPicker locale={id} weekStartsOn={1} captionLayout="dropdown" showOutsideDays={false}
    labels={{ labelNext: () => "Bulan berikutnya", labelPrevious: () => "Bulan sebelumnya", labelMonthDropdown: () => "Bulan", labelYearDropdown: () => "Tahun" }}
    className={cn("gambut-calendar w-[266px] text-sm", className)}
    classNames={{ ...defaults,
      months: "relative", month: "space-y-3", month_caption: "flex h-10 items-center justify-center px-9",
      caption_label: "flex items-center gap-1 p-1.5 text-sm font-medium", dropdowns: "flex items-center justify-center gap-1", dropdown_root: "relative rounded-md hover:bg-muted focus-within:ring-2 focus-within:ring-ring",
      dropdown: "absolute inset-0 h-full w-full cursor-pointer opacity-0", months_dropdown: "", years_dropdown: "",
      nav: "pointer-events-none absolute inset-x-0 top-0 flex justify-between", button_previous: "calendar-nav pointer-events-auto", button_next: "calendar-nav pointer-events-auto",
      month_grid: "w-full table-fixed border-collapse", weekdays: "", weekday: "h-8 text-xs font-normal text-muted-foreground",
      week: "", day: "relative p-0 text-center", day_button: "calendar-day", today: "font-bold underline decoration-teal underline-offset-4",
      selected: "calendar-selected", range_start: "calendar-range-start", range_end: "calendar-range-end", range_middle: "calendar-range-middle",
      disabled: "text-muted-foreground/35", hidden: "invisible", outside: "text-muted-foreground/40", ...classNames,
    }}
    components={{ Dropdown: CalendarDropdown, Chevron: ({ orientation, className }) => orientation === "left" ? <ChevronLeft className={cn("size-4", className)} /> : orientation === "right" ? <ChevronRight className={cn("size-4", className)} /> : <ChevronDown className={cn("size-3", className)} /> }}
    {...props} />;
}
