import type { ComponentProps } from "react";
import { cn } from "./utils";

export function Alert({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="alert" role="note" className={cn("flex gap-3 rounded-lg border bg-card p-4 text-sm [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:mt-0.5", className)} {...props} />;
}
export function AlertTitle({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("font-medium", className)} {...props} />;
}
export function AlertDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("mt-1 text-sm leading-6 text-muted-foreground", className)} {...props} />;
}
