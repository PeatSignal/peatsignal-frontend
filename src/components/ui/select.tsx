"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  disabled?: boolean;
}

type SelectProps = Omit<ComponentProps<typeof SelectPrimitive.Trigger>, "value" | "onChange" | "children"> & {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  name?: string;
  required?: boolean;
};

// Empty values remain empty in application state; Radix items need a nonempty identity.
const EMPTY_VALUE = "__gambutops_empty_option__";

export function Select({ value, onValueChange, options, placeholder = "Pilih…", name, required, disabled, className, ...props }: SelectProps) {
  const selected = options.find((option) => option.value === value);
  const groups = new Map<string, SelectOption[]>();
  for (const option of options) {
    const group = option.group ?? "";
    groups.set(group, [...(groups.get(group) ?? []), option]);
  }

  return <SelectPrimitive.Root value={selected ? value || EMPTY_VALUE : ""} onValueChange={(next) => onValueChange(next === EMPTY_VALUE ? "" : next)}
    name={name} required={required} disabled={disabled || options.length === 0}>
    <SelectPrimitive.Trigger data-slot="select" data-value={value}
      className={cn("flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-card px-3 text-left text-sm font-normal transition-colors duration-150 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-primary/40 data-[state=open]:ring-2 data-[state=open]:ring-ring/20 aria-[invalid=true]:border-destructive [&>span:first-child]:min-w-0 [&>span:first-child]:truncate", className)} {...props}>
      <SelectPrimitive.Value placeholder={options.length === 0 ? "Belum ada pilihan" : placeholder}>{selected?.label}</SelectPrimitive.Value>
      <SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content position="popper" sideOffset={6} align="start" collisionPadding={8}
        className="z-[80] max-h-[min(320px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border bg-card text-foreground shadow-sm">
        <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center bg-card text-muted-foreground"><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="max-h-[min(320px,var(--radix-select-content-available-height))] p-1">
          {[...groups].map(([group, items]) => <SelectPrimitive.Group key={group}>
            {group && <SelectPrimitive.Label className="px-3 pt-3 pb-1.5 text-[11px] font-medium text-muted-foreground">{group}</SelectPrimitive.Label>}
            {items.map((option) => <SelectPrimitive.Item key={option.value} value={option.value || EMPTY_VALUE} disabled={option.disabled} textValue={option.label}
              data-value={option.value} aria-label={option.label}
              className="relative flex min-h-10 cursor-pointer items-center gap-3 rounded-lg py-2 pr-9 pl-3 text-sm outline-none transition-colors duration-150 select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-muted data-[state=checked]:bg-secondary data-[state=checked]:font-medium data-[state=checked]:text-primary">
              <div className="min-w-0 flex-1">
                <SelectPrimitive.ItemText><span className="block break-words">{option.label}</span></SelectPrimitive.ItemText>
                {option.description && <span className="mt-0.5 block text-xs font-normal break-words text-muted-foreground">{option.description}</span>}
              </div>
              <SelectPrimitive.ItemIndicator className="absolute right-3"><Check className="size-4" aria-hidden="true" /></SelectPrimitive.ItemIndicator>
            </SelectPrimitive.Item>)}
          </SelectPrimitive.Group>)}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center bg-card text-muted-foreground"><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
