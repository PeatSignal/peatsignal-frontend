import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-secondary text-primary",
        outline: "border-border bg-card text-muted-foreground",
        warning: "border-amber-200 bg-amber-50 text-amber-900",
        destructive: "border-red-200 bg-red-50 text-red-800",
        teal: "border-teal/20 bg-teal/5 text-teal",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({ className, variant, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
