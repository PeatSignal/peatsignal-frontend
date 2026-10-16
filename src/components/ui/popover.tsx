"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps } from "react";
import { cn } from "./utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({ className, align = "start", sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return <PopoverPrimitive.Portal><PopoverPrimitive.Content align={align} sideOffset={sideOffset} collisionPadding={8}
    className={cn("z-[60] max-h-[var(--radix-popover-content-available-height)] max-w-[calc(100vw-16px)] overflow-auto rounded-xl border bg-card p-3 text-foreground shadow-sm outline-none", className)} {...props} /></PopoverPrimitive.Portal>;
}
